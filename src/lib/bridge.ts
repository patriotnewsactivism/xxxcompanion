import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { UserRow } from "@/lib/session";

/**
 * Surge embed bridge.
 *
 * When the companion is embedded inside Surge (iframe), browser third-party
 * cookie blocking means the standalone cookie session cannot be relied on.
 * Instead, Surge hands the companion the user's Supabase access token via
 * postMessage; the companion exchanges it at /api/bridge for a short-lived
 * HMAC-signed bearer token that every API route accepts.
 */

const BRIDGE_SECRET = process.env.BRIDGE_SESSION_SECRET ?? "";
export const BRIDGE_TTL_SECONDS = 12 * 60 * 60; // match Surge's Supabase token lifetime

export interface BridgePayload {
  uid: number; // companion users.id
  sub: string; // Surge Supabase user id
  tier: string;
  age: boolean;
  exp: number; // unix seconds
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", BRIDGE_SECRET).update(data).digest("base64url");
}

export function createBridgeToken(payload: Omit<BridgePayload, "exp">): string {
  if (!BRIDGE_SECRET) throw new Error("BRIDGE_SESSION_SECRET is not configured.");
  const full: BridgePayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + BRIDGE_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `sw1.${body}.${hmac(body)}`;
}

export function verifyBridgeToken(token: string): BridgePayload | null {
  if (!BRIDGE_SECRET || !token.startsWith("sw1.")) return null;
  const [, bodyB64, sig] = token.split(".");
  if (!bodyB64 || !sig) return null;
  const expected = hmac(bodyB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(bodyB64, "base64url").toString("utf8")
    ) as BridgePayload;
    if (typeof payload.uid !== "number" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Extract the bearer token from an Authorization header, if present. */
export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.startsWith("sw1.") ? token : null;
}

/** Load the companion user for a verified bridge bearer token. */
export async function getUserFromBearer(request: Request): Promise<UserRow | null> {
  const token = getBearerToken(request);
  if (!token) return null;
  const payload = verifyBridgeToken(token);
  if (!payload) return null;
  const rows = await db.select().from(users).where(eq(users.id, payload.uid));
  const user = rows[0];
  if (!user || user.terminated) return null;
  return user;
}
