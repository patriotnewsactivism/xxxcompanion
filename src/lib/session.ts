import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AGE_COOKIE } from "@/lib/safety/ageGate";

export type UserRow = typeof users.$inferSelect;

export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get("user_id")?.value;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getSessionUser(): Promise<UserRow | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  const rows = await db.select().from(users).where(eq(users.id, id));
  return rows[0] ?? null;
}

export async function isAgeVerified(): Promise<boolean> {
  const store = await cookies();
  return store.get(AGE_COOKIE)?.value === "1";
}