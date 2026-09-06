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

export type KinkCategory =
  | "power-exchange" | "bondage" | "impact" | "sensation"
  | "tease-denial" | "exhibition" | "fetish" | "roleplay" | "service" | "aftercare" | "custom";

export interface Kink {
  id: string;          // kebab-case, e.g. "gentle-dom"
  label: string;       // "Gentle Domination"
  category: KinkCategory;
  description?: string; // one short sentence
}

export interface SceneSetting {
  location: string;    // "a candlelit bedroom in a penthouse"
  atmosphere: string;  // "low jazz, rain against floor-to-ceiling glass"
  dressing?: string;   // persona's clothing in scene
  era?: string;        // optional: "modern", "1920s", "fantasy"
}

export interface ScenePreset {
  id: string;
  label: string;       // e.g. "Candlelit Bedroom"
  scene: SceneSetting;
}

export type ExplicitnessLevel = 1 | 2 | 3 | 4 | 5;
export type NarrativeStyle = "second" | "first" | "third";
export type ResponseLength = "concise" | "balanced" | "detailed";

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  genre: string;                  // from PERSONA_GENRES
  relationshipDynamic: string;    // from RELATIONSHIP_DYNAMICS
  tone: string;
  definition: string;
  appearance?: string;            // physical description
  pronouns?: string;              // persona pronouns, e.g. "she/her"
  kinks: string[];                // kink ids + freeform tags (normalized)
  hardLimits: string[];           // absolute never-do
  softLimits: string[];           // needs consent/check-in first
  scene?: SceneSetting;
  explicitness: ExplicitnessLevel;
  narrativeStyle: NarrativeStyle;
  responseLength: ResponseLength;
  greeting?: string;              // opening message
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

export interface UserProfile {
  userId: number;
  displayName?: string;
  pronouns?: string;   // user's pronouns, e.g. "he/him"
  gender?: string;     // user's gender identity
  turnOns: string[];   // kink ids + freeform tags
  hardLimits: string[];
  softLimits: string[];
  safeWord?: string;
  aftercare?: string;  // what the user needs after intense scenes
  notes?: string;      // free-form "about me / how to love me"
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
  greeting?: string;
}