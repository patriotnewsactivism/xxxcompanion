import type { personas } from "@/db/schema";
import { DEFAULT_PERSONA_FIELDS } from "@/lib/persona/options";
import type {
  ExplicitnessLevel,
  NarrativeStyle,
  Persona,
  ResponseLength,
  SceneSetting,
} from "@/lib/types";

type PersonaRow = typeof personas.$inferSelect;

const EXPLICITNESS_LEVELS: ExplicitnessLevel[] = [1, 2, 3, 4, 5];
const NARRATIVE_STYLES: NarrativeStyle[] = ["second", "first", "third"];
const RESPONSE_LENGTHS: ResponseLength[] = ["concise", "balanced", "detailed"];

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function parseScene(raw: string | null): SceneSetting | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as SceneSetting;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.location === "string" &&
      typeof parsed.atmosphere === "string"
    ) {
      return parsed;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function parseVoiceConfig(raw: string | null): Persona["voiceConfig"] {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Persona["voiceConfig"];
  } catch {
    return undefined;
  }
}

function clampExplicitness(value: number): ExplicitnessLevel {
  return EXPLICITNESS_LEVELS.includes(value as ExplicitnessLevel)
    ? (value as ExplicitnessLevel)
    : DEFAULT_PERSONA_FIELDS.explicitness;
}

function asNarrativeStyle(value: string): NarrativeStyle {
  return NARRATIVE_STYLES.includes(value as NarrativeStyle)
    ? (value as NarrativeStyle)
    : DEFAULT_PERSONA_FIELDS.narrativeStyle;
}

function asResponseLength(value: string): ResponseLength {
  return RESPONSE_LENGTHS.includes(value as ResponseLength)
    ? (value as ResponseLength)
    : DEFAULT_PERSONA_FIELDS.responseLength;
}

export function rowToPersona(row: PersonaRow): Persona {
  return {
    id: `custom-${row.id}`,
    name: row.name,
    tagline: row.tagline,
    genre: row.genre,
    relationshipDynamic: row.relationshipDynamic,
    tone: row.tone,
    definition: row.definition,
    appearance: row.appearance ?? undefined,
    pronouns: row.pronouns ?? undefined,
    kinks: parseStringArray(row.kinks),
    hardLimits: parseStringArray(row.hardLimits),
    softLimits: parseStringArray(row.softLimits),
    scene: parseScene(row.scene),
    explicitness: clampExplicitness(row.explicitness),
    narrativeStyle: asNarrativeStyle(row.narrativeStyle),
    responseLength: asResponseLength(row.responseLength),
    greeting: row.greeting ?? undefined,
    voiceConfig: parseVoiceConfig(row.voiceConfig),
    avatarPath: row.avatarPath,
    isCustom: row.isCustom,
    premiumOnly: row.premiumOnly,
  };
}