import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { personas } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { PRESET_PERSONAS } from "@/lib/persona/presets";
import { hasFeature, isTier } from "@/lib/tiers";
import type { Persona, Tier } from "@/lib/types";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "persona"}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const user = await getSessionUser();
  const tier: Tier = user && isTier(user.tier) ? user.tier : "free";

  let customPersonas: Persona[] = [];
  if (user) {
    const rows = await db.select().from(personas).where(eq(personas.userId, user.id));
    customPersonas = rows.map((row) => ({
      id: `custom-${row.id}`,
      name: row.name,
      tagline: row.tagline,
      genre: row.genre,
      relationshipDynamic: row.relationshipDynamic,
      tone: row.tone,
      definition: row.definition,
      voiceConfig: row.voiceConfig
        ? (JSON.parse(row.voiceConfig) as Persona["voiceConfig"])
        : undefined,
      avatarPath: row.avatarPath,
      isCustom: true,
      premiumOnly: row.premiumOnly,
    }));
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

  let body: {
    name?: string;
    tagline?: string;
    genre?: string;
    relationshipDynamic?: string;
    tone?: string;
    definition?: string;
    voiceConfig?: Persona["voiceConfig"];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const definition = body.definition?.trim();
  if (!name || !definition) {
    return NextResponse.json(
      { error: "Name and definition are required." },
      { status: 400 }
    );
  }

  const inserted = await db
    .insert(personas)
    .values({
      userId: user.id,
      slug: slugify(name),
      name,
      tagline: body.tagline?.trim() ?? "Custom companion",
      genre: body.genre?.trim() ?? "custom",
      relationshipDynamic: body.relationshipDynamic?.trim() ?? "companion",
      tone: body.tone?.trim() ?? "warm, adaptive",
      definition,
      voiceConfig: body.voiceConfig ? JSON.stringify(body.voiceConfig) : null,
      isCustom: true,
      premiumOnly: false,
    })
    .returning({ id: personas.id });

  return NextResponse.json(
    { id: `custom-${inserted[0].id}`, name },
    { status: 201 }
  );
}