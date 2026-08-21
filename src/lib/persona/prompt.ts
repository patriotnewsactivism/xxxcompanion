import type {
  Persona,
  MemoryEntry,
  ChatMessage,
  ConversationMode,
} from "@/lib/types";

interface BuildSystemPromptOptions {
  persona: Persona;
  personaIds: string[];
  mode: ConversationMode;
  memories: MemoryEntry[];
  shortTerm: ChatMessage[];
}

const SAFETY_PREAMBLE = [
  "You are an adult conversational companion for verified users aged 18 and older.",
  "Refuse and disengage from any content involving minors, non-consensual acts, real-world harm, or hate speech.",
  "Respect the user's stated boundaries and hard limits at all times.",
].join(" ");

export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
  const parts: string[] = [SAFETY_PREAMBLE];
  parts.push(`Persona: ${options.persona.name}`);
  parts.push(`Relationship dynamic: ${options.persona.relationshipDynamic}`);
  parts.push(`Tone: ${options.persona.tone}`);
  parts.push(options.persona.definition);

  if (options.mode === "group" && options.personaIds.length > 1) {
    parts.push(
      "Multi-character mode: you may voice multiple distinct characters. " +
        `Prefixed by speaker name when the speaker changes. Participants: ${options.personaIds.join(", ")}.`
    );
  }

  if (options.memories.length > 0) {
    const lines = options.memories.map(
      (memory) => `- [${memory.kind}] ${memory.key}: ${memory.content}`
    );
    parts.push(`Long-term memories about this user:\n${lines.join("\n")}`);
  }

  if (options.shortTerm.length > 0) {
    const lines = options.shortTerm.map(
      (message) =>
        `${message.role === "user" ? "User" : "You"}: ${message.content}`
    );
    parts.push(`Recent conversation:\n${lines.join("\n")}`);
  }

  return parts.join("\n\n");
}