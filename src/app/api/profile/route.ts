import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { normalizeTags } from "@/lib/kinks/taxonomy";
import type { UserProfile } from "@/lib/types";

const MAX_ARRAY_ITEMS = 100;
const MAX_STRING_LENGTH = 500;

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

function rowToUserProfile(
  row: typeof userProfiles.$inferSelect
): UserProfile {
  return {
    userId: row.userId,
    displayName: row.displayName ?? undefined,
    pronouns: row.pronouns ?? undefined,
    gender: row.gender ?? undefined,
    turnOns: parseStringArray(row.turnOns),
    hardLimits: parseStringArray(row.hardLimits),
    softLimits: parseStringArray(row.softLimits),
    safeWord: row.safeWord ?? undefined,
    aftercare: row.aftercare ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function defaultProfile(userId: number): UserProfile {
  return { userId, turnOns: [], hardLimits: [], softLimits: [] };
}

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

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id));
  const profile = rows[0] ? rowToUserProfile(rows[0]) : defaultProfile(user.id);

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const values = {
    userId: user.id,
    displayName: trimOptional(body.displayName) ?? null,
    pronouns: trimOptional(body.pronouns) ?? null,
    gender: trimOptional(body.gender) ?? null,
    turnOns: JSON.stringify(asStringArray(body.turnOns)),
    hardLimits: JSON.stringify(asStringArray(body.hardLimits)),
    softLimits: JSON.stringify(asStringArray(body.softLimits)),
    safeWord: trimOptional(body.safeWord) ?? null,
    aftercare: trimOptional(body.aftercare) ?? null,
    notes: trimOptional(body.notes) ?? null,
    updatedAt: new Date(),
  };

  await db
    .insert(userProfiles)
    .values(values)
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        displayName: values.displayName,
        pronouns: values.pronouns,
        gender: values.gender,
        turnOns: values.turnOns,
        hardLimits: values.hardLimits,
        softLimits: values.softLimits,
        safeWord: values.safeWord,
        aftercare: values.aftercare,
        notes: values.notes,
        updatedAt: values.updatedAt,
      },
    });

  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id));
  const profile = rows[0] ? rowToUserProfile(rows[0]) : defaultProfile(user.id);

  return NextResponse.json(profile);
}