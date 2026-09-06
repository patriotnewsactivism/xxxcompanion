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
 * Fallback chain. Order matters — the product's mission is explicit adult
 * roleplay, so the chain leads with models that can actually deliver it:
 *
 *   0. adult (ADULT_CHAT_ENDPOINT / ADULT_CHAT_API_KEY / ADULT_CHAT_MODEL)
 *        Any OpenAI-compatible endpoint the operator trusts for adult content
 *        (e.g. "https://api.venice.ai/api/v1" with "dolphin-mistral-24b").
 *        Included ONLY when ADULT_CHAT_API_KEY is set; model defaults to
 *        "dolphin-mistral-24b", the endpoint is required.
 *   1. openrouter-adult (OPENROUTER_API_KEY)
 *        "cognitivecomputations/dolphin-mistral-24b-venice-edition" — the
 *        "Venice: Uncensored" fine-tune, verified live on OpenRouter
 *        (is_moderated: false, ~$0.0002/$0.0009 per token), known to handle
 *        explicit adult roleplay without refusal.
 *   2. openrouter-free (OPENROUTER_API_KEY)
 *        Free tier model for cost-sensitive fallback.
 *   3-6. cerebras -> groq -> cohere -> mistral.
 *
 * HONEST FLAG: the mainstream slot 3-6 models are safety-tuned instruct
 * models. They'll generally handle romantic/flirty and consensual-BDSM-
 * framed content, but may hedge or refuse at the explicit end regardless
 * of prompt framing. That's expected — the product answer is the adult slot
 * at position 0 (or the openrouter-adult slot at 1), not fighting a model's
 * safety tuning by cranking temperature or rewording prompts. Configure
 * ADULT_CHAT_* (or OPENROUTER_API_KEY) for true unfiltered output.
 */
const BASE_PROVIDERS: ProviderConfig[] = [
  {
    name: "openrouter-adult",
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "cognitivecomputations/dolphin-mistral-24b-venice-edition",
  },
  {
    name: "openrouter-free",
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-oss-20b:free",
  },
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
];

function buildProviderChain(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];
  const adultKey = process.env.ADULT_CHAT_API_KEY;
  const adultEndpoint = process.env.ADULT_CHAT_ENDPOINT;
  if (adultKey && adultEndpoint) {
    providers.push({
      name: "adult",
      apiKeyEnv: "ADULT_CHAT_API_KEY",
      baseUrl: adultEndpoint.replace(/\/+$/, ""),
      model: process.env.ADULT_CHAT_MODEL || "dolphin-mistral-24b",
    });
  }
  providers.push(...BASE_PROVIDERS);
  return providers;
}

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

  const temperature = params.temperature ?? 0.95;
  const maxTokens = params.maxTokens ?? 1024;

  for (const provider of buildProviderChain()) {
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
    return "I'm right here with you, and I'm not going anywhere. Tell me what's on your mind tonight.";
  }

  return `${name} lets the silence stretch a moment, then meets your gaze with a slow, knowing smile. "There's heat in that... and I want every part of it. Tell me what you're picturing, and I'll make it real."`;
}