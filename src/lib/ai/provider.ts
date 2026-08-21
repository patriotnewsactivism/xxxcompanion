import type { ChatMessage } from "@/lib/types";

export interface GenerateParams {
  system: string;
  messages: ChatMessage[];
  assistantName?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ProviderConfig {
  name: string;
  apiKeyEnv: string;
  baseUrl: string;
  model: string;
}

/**
 * Fallback chain. Order matters — cheapest/fastest confirmed-live providers first.
 * Mirrors the portfolio-wide pattern (Apex/autonomous-coder/codeforge-v2):
 * Cerebras -> Groq -> Cohere -> Mistral -> OpenRouter(free).
 *
 * HONEST FLAG: these are mainstream, safety-tuned instruct models. They'll
 * generally handle romantic/flirty and consensual-BDSM-framed content fine,
 * but may hedge or refuse on the more explicit end regardless of persona
 * framing. If real usage shows consistent refusals, the fix is swapping in
 * an adult-content-tolerant model for that slot specifically — don't fight
 * a model's own safety tuning by cranking temperature or rewording prompts.
 */
const PROVIDERS: ProviderConfig[] = [
  {
    name: "cerebras",
    apiKeyEnv: "CEREBRAS_API_KEY",
    baseUrl: "https://api.cerebras.ai/v1",
    model: "llama-3.3-70b",
  },
  {
    name: "groq",
    apiKeyEnv: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "cohere",
    apiKeyEnv: "COHERE_API_KEY",
    baseUrl: "https://api.cohere.ai/compatibility/v1",
    model: "command-r-plus-08-2024",
  },
  {
    name: "mistral",
    apiKeyEnv: "MISTRAL_API_KEY",
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-large-latest",
  },
  {
    name: "openrouter-free",
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-oss-20b:free",
  },
];

async function callProvider(
  provider: ProviderConfig,
  providerMessages: ProviderMessage[],
  temperature: number,
  maxTokens: number
): Promise<string | null> {
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) return null;

  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        messages: providerMessages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      console.warn(`[ai/provider] ${provider.name} returned ${res.status}`);
      return null;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    return content && content.trim().length > 0 ? content : null;
  } catch (error) {
    console.warn(`[ai/provider] ${provider.name} failed:`, error);
    return null;
  }
}

export async function generateChat(params: GenerateParams): Promise<string> {
  const providerMessages: ProviderMessage[] = [
    { role: "system", content: params.system },
    ...params.messages.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    })),
  ];

  const temperature = params.temperature ?? 0.9;
  const maxTokens = params.maxTokens ?? 512;

  for (const provider of PROVIDERS) {
    const result = await callProvider(provider, providerMessages, temperature, maxTokens);
    if (result) return result;
  }

  return fallbackReply(params);
}

function fallbackReply(params: GenerateParams): string {
  const name = params.assistantName ?? "your companion";
  const lastUser = params.messages
    .filter((message) => message.role === "user")
    .at(-1)?.content;

  if (!lastUser || lastUser.trim().length === 0) {
    return "I'm here whenever you're ready. What's on your mind?";
  }

  return `${name} takes a slow breath and meets your gaze with a soft smile. "I hear you. Tell me more about what's behind that."`;
}
