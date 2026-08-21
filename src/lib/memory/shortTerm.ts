import type { ChatMessage } from "@/lib/types";

export const SHORT_TERM_LIMIT = 20;

export function toShortTermContext(
  messages: ChatMessage[],
  limit = SHORT_TERM_LIMIT
): ChatMessage[] {
  return messages.slice(-limit);
}