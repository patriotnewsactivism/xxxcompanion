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

export async function generateChat(params: GenerateParams): Promise<string> {
  const apiKey = process.env.CHAT_API_KEY;
  const baseUrl = process.env.CHAT_API_BASE_URL;

  if (apiKey && baseUrl) {
    const providerMessages: ProviderMessage[] = [
      { role: "system", content: params.system },
      ...params.messages.map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
    ];

    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.CHAT_MODEL ?? "default",
          messages: providerMessages,
          temperature: params.temperature ?? 0.9,
          max_tokens: params.maxTokens ?? 512,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch {
      return fallbackReply(params);
    }
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