import type {
  ExplicitnessLevel,
  NarrativeStyle,
  Persona,
  ResponseLength,
} from "@/lib/types";

export const EXPLICITNESS_LABELS: Record<ExplicitnessLevel, string> = {
  1: "Suggestive — tension and fade-to-black",
  2: "Tasteful — sensual, implied",
  3: "Explicit — direct, briefly graphic",
  4: "Graphic — detailed and anatomical",
  5: "Unfiltered — full sensory erotica",
};

export const PERSONA_GENRES: string[] = [
  "romance",
  "seduction",
  "bdsm",
  "power-exchange",
  "flirtation",
  "roleplay",
  "caregiving",
  "fantasy",
  "friends-with-benefits",
  "custom",
];

export const RELATIONSHIP_DYNAMICS: string[] = [
  "romantic-partner",
  "dominant",
  "submissive",
  "switch",
  "flirty-companion",
  "storyteller",
  "caregiver",
  "temptress",
  "daddy-dynamic",
  "mommy-dynamic",
  "brat",
  "service-sub",
  "dominant-personal-trainer",
  "custom",
];

export const NARRATIVE_STYLE_LABELS: Record<NarrativeStyle, string> = {
  second: 'Second person — "you" address, most immersive',
  first: 'First person — "I" narration, intimate and confessional',
  third: 'Third person — "she/he" describing, cinematic distance',
};

export const RESPONSE_LENGTH_LABELS: Record<ResponseLength, string> = {
  concise: "Concise — short, punchy replies that keep the scene moving",
  balanced: "Balanced — a few rich paragraphs with room to breathe",
  detailed: "Detailed — long, lavish, slow-burn scenes",
};

export const DEFAULT_PERSONA_FIELDS: Pick<
  Persona,
  | "kinks"
  | "hardLimits"
  | "softLimits"
  | "explicitness"
  | "narrativeStyle"
  | "responseLength"
  | "scene"
  | "greeting"
> = {
  kinks: [],
  hardLimits: ["non-consent", "minors"],
  softLimits: [],
  explicitness: 3,
  narrativeStyle: "second",
  responseLength: "balanced",
  scene: undefined,
  greeting: undefined,
};