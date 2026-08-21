export type Tier = "free" | "premium";

export type TierFeature =
  | "text"
  | "longTermMemory"
  | "voice"
  | "image"
  | "video"
  | "multiCharacter"
  | "customPersona";

export type ConversationMode = "single" | "group";

export type SpeakerRole = "user" | "assistant";

export interface VoiceConfig {
  accent?: string;
  pitch?: number;
  pace?: number;
  breathiness?: number;
}

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  genre: string;
  relationshipDynamic: string;
  tone: string;
  definition: string;
  voiceConfig?: VoiceConfig;
  avatarPath?: string | null;
  isCustom: boolean;
  premiumOnly: boolean;
}

export type MemoryKind = "preference" | "boundary" | "nickname" | "note";

export interface MemoryEntry {
  kind: MemoryKind;
  key: string;
  content: string;
  embedding?: number[] | null;
}

export interface ChatMessage {
  speakerToken?: string;
  role: SpeakerRole;
  content: string;
}

export type ModerationAction = "allow" | "block" | "terminate";

export type ModerationCategory =
  | "minor"
  | "sexualViolence"
  | "hate"
  | "nonConsensualDeepfake"
  | "selfHarm";

export interface ModerationResult {
  action: ModerationAction;
  categories: ModerationCategory[];
  reason?: string;
}

export interface ChatRequest {
  conversationId?: number;
  personaId?: string;
  mode: ConversationMode;
  message: string;
}

export interface ChatResponse {
  reply: string;
  speakerToken: string;
  conversationId: number;
  action: "delivered" | "blocked" | "terminated";
  reason?: string;
}