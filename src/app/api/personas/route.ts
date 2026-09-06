import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { personas } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { PRESET_PERSONAS } from "@/lib/persona/presets";
import { DEFAULT_PERSONA_FIELDS } from "@/lib/persona/options";
import { rowToPersona } from "@/lib/persona/mapping";
import { normalizeTags } from "@/lib/kinks/taxonomy";
import { hasFeature, isTier } from "@/lib/tiers";
import type {
  ExplicitnessLevel,
  NarrativeStyle,
  Persona,
  ResponseLength,
  SceneSetting,
  Tier,
} from "@/lib/types";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "persona"}-${Math.random().toString(36).slice(2, 8)}`;
}

const MAX_ARRAY_ITEMS = 100;
const MAX_STRING_LENGTH = 500;

const EXPLICITNESS_LEVELS: ExplicitnessLevel[] = [1, 2, 3, 4, 5];
const NARRATIVE_STYLES: NarrativeStyle[] = ["second", "first", "third"];
const RESPONSE_LENGTHS: ResponseLength[] = ["concise", "balanced", "detailed"];

function trimOptional(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, MAX_STRING_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const strings = value.filter(
    (entry): entry is string => typeof entry === "string"
  );
  return normalizeTags(strings).slice(0, MAX_ARRAY_ITEMS);
}

function asScene(value: unknown): SceneSetting | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.location !== "string" ||
    typeof candidate.atmosphere !== "string"
  ) {
    return undefined;
  }
  const scene: SceneSetting = {
    location: candidate.location.trim().slice(0, MAX_STRING_LENGTH) || "a private room",
    atmosphere:
      candidate.atmosphere.trim().slice(0, MAX_STRING_LENGTH) || "warm and intimate",
  };
  const dressing = trimOptional(candidate.dressing);
  if (dressing) scene.dressing = dressing;
  const era = trimOptional(candidate.era);
  if (era) scene.era = era;
  return scene;
}

function asExplicitness(value: unknown): ExplicitnessLevel {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_PERSONA_FIELDS.explicitness;
  }
  const clamped = Math.max(1, Math.min(5, Math.round(value)));
  return EXPLICITNESS_LEVELS.includes(clamped as ExplicitnessLevel)
    ? (clamped as ExplicitnessLevel)
    : DEFAULT_PERSONA_FIELDS.explicitness;
}

function asNarrativeStyle(value: unknown): NarrativeStyle {
  return typeof value === "string" && NARRATIVE_STYLES.includes(value as NarrativeStyle)
    ? (value as NarrativeStyle)
    : DEFAULT_PERSONA_FIELDS.narrativeStyle;
}

function asResponseLength(value: unknown): ResponseLength {
  return typeof value === "string" &&
    RESPONSE_LENGTHS.includes(value as ResponseLength)
    ? (value as ResponseLength)
    : DEFAULT_PERSONA_FIELDS.responseLength;
}

export async function GET() {
  const user = await getSessionUser();
  const tier: Tier = user && isTier(user.tier) ? user.tier : "free";

  let customPersonas: Persona[] = [];
  if (user) {
    const rows = await db.select().from(personas).where(eq(personas.userId, user.id));
    customPersonas = rows.map(rowToPersona);
  }

  return NextResponse.json({
    tier,
    presets: PRESET_PERSONAS,
    custom: customPersonas,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !user.ageVerified) {
    return NextResponse.json({ error: "Age verification required." }, { status: 403 });
  }
  const tier: Tier = isTier(user.tier) ? user.tier : "free";
  if (!hasFeature(tier, "customPersona")) {
    return NextResponse.json(
      { error: "Custom personas require a premium subscription." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = trimOptional(body.name);
  const definition = trimOptional(body.definition);
  if (!name || !definition) {
    return NextResponse.json(
      { error: "Name and definition are required." },
      { status: 400 }
    );
  }

  const scene = asScene(body.scene);

  const inserted = await db
    .insert(personas)
    .values({
      userId: user.id,
      slug: slugify(name),
      name,
      tagline: trimOptional(body.tagline) ?? "Custom companion",
      genre: trimOptional(body.genre) ?? "custom",
      relationshipDynamic: trimOptional(body.relationshipDynamic) ?? "companion",
      tone: trimOptional(body.tone) ?? "warm, adaptive",
      definition,
      appearance: trimOptional(body.appearance) ?? null,
      pronouns: trimOptional(body.pronouns) ?? null,
      kinks: JSON.stringify(
        asStringArray(
          body.kinks ?? DEFAULT_PERSONA_FIELDS.kinks
        )
      ),
      hardLimits: JSON.stringify(
        asStringArray(
          body.hardLimits ?? DEFAULT_PERSONA_FIELDS.hardLimits
        )
      ),
      softLimits: JSON.stringify(
        asStringArray(
          body.softLimits ?? DEFAULT_PERSONA_FIELDS.softLimits
        )
      ),
      scene: scene ? JSON.stringify(scene) : null,
      explicitness: asExplicitness(
        body.explicitness ?? DEFAULT_PERSONA_FIELDS.explicitness
      ),
      narrativeStyle: asNarrativeStyle(
        body.narrativeStyle ?? DEFAULT_PERSONA_FIELDS.narrativeStyle
      ),
      responseLength: asResponseLength(
        body.responseLength ?? DEFAULT_PERSONA_FIELDS.responseLength
      ),
      greeting: trimOptional(body.greeting) ?? null,
      voiceConfig:
        typeof body.voiceConfig === "object" && body.voiceConfig !== null
          ? JSON.stringify(body.voiceConfig)
          : null,
      isCustom: true,
      premiumOnly: false,
    })
    .returning({ id: personas.id });

  return NextResponse.json(
    { id: `custom-${inserted[0].id}`, name },
    { status: 201 }
  );
}