import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createBridgeToken } from "@/lib/bridge";

/**
 * Surge embed bridge — exchange a Surge Supabase access token for a
 * companion bearer token.
 *
 * POST { surgeToken }
 *  1. Validate the token against Surge's Supabase auth endpoint (server to
 *     server; no shared crypto state required).
 *  2. Look up the Surge user's premium status via the surge_premium_status
 *     RPC with the service-role key.
 *  3. Find-or-create the companion user keyed by surge_sub and sync tier.
 *  4. Return a short-lived HMAC bearer token the embedded app uses for all
 *     API calls (bypassing cookies, which are blocked in third-party
 *     iframes).
 */

const SURGE_URL = process.env.SURGE_SUPABASE_URL ?? "";
const SURGE_ANON = process.env.SURGE_SUPABASE_ANON_KEY ?? "";

interface SurgeUserResponse {
  id?: string;
  email?: string;
}

// Premium check rides the user's own validated JWT — surge_premium_status()
// is security-definer and derives identity from auth.uid(), so no service
// role key is needed and the client can never spoof the claim.
async function surgePremium(surgeToken: string): Promise<boolean> {
  if (!SURGE_URL || !SURGE_ANON) return false;
  try {
    const res = await fetch(`${SURGE_URL}/rest/v1/rpc/surge_premium_status`, {
      method: "POST",
      headers: {
        apikey: SURGE_ANON,
        Authorization: `Bearer ${surgeToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { is_premium?: boolean } | null;
    return !!data?.is_premium;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: { surgeToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const surgeToken = body.surgeToken;
  if (!surgeToken || !SURGE_URL || !SURGE_ANON) {
    return NextResponse.json(
      { error: "Surge embed is not configured on this deployment." },
      { status: 503 }
    );
  }

  // 1. Validate the Surge session token.
  let surgeSub = "";
  try {
    const res = await fetch(`${SURGE_URL}/auth/v1/user`, {
      headers: { apikey: SURGE_ANON, Authorization: `Bearer ${surgeToken}` },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Your Surge session has expired. Reopen the AI Companion." },
        { status: 401 }
      );
    }
    const user = (await res.json()) as SurgeUserResponse;
    surgeSub = user.id ?? "";
  } catch {
    return NextResponse.json({ error: "Could not reach Surge auth." }, { status: 502 });
  }
  if (!surgeSub) {
    return NextResponse.json({ error: "Invalid Surge session." }, { status: 401 });
  }

  // 2. Server-side premium check — never trust the client's claim.
  const premium = await surgePremium(surgeToken);

  // 3. Find-or-create the companion user keyed by surge_sub.
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.surgeSub, surgeSub));
  let row = existing[0];
  const tier = premium ? "premium" : "free";
  if (!row) {
    const inserted = await db
      .insert(users)
      .values({ surgeSub, tier })
      .returning();
    row = inserted[0];
  } else if (row.tier !== tier) {
    // Sync premium status on every bridge call — Surge premium can expire.
    const updated = await db
      .update(users)
      .set({ tier })
      .where(eq(users.id, row.id))
      .returning();
    row = updated[0];
  }
  if (!row || row.terminated) {
    return NextResponse.json(
      { error: "This account has been permanently terminated." },
      { status: 403 }
    );
  }

  // 4. Mint the bearer token.
  const token = createBridgeToken({
    uid: row.id,
    sub: surgeSub,
    tier: row.tier,
    age: row.ageVerified,
  });
  return NextResponse.json({
    token,
    tier: row.tier,
    ageVerified: row.ageVerified,
  });
}
