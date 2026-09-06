"use client";

/**
 * Client side of the Surge embed bridge.
 *
 * Holds the companion bearer token in memory (no cookies — they are blocked
 * in third-party iframes) and attaches it to every API call via authFetch.
 * All component fetches go through authFetch so the same code path serves
 * both the standalone site (cookie session) and the Surge embed (bearer).
 */

let bridgeToken: string | null = null;
let onTokenListeners: Array<(t: string) => void> = [];

export function setBridgeToken(token: string) {
  bridgeToken = token;
  for (const l of onTokenListeners) l(token);
}

export function getBridgeToken(): string | null {
  return bridgeToken;
}

export function onBridgeToken(listener: (t: string) => void) {
  onTokenListeners.push(listener);
  return () => {
    onTokenListeners = onTokenListeners.filter((l) => l !== listener);
  };
}

export function isEmbedded(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return false;
  }
}

/** Origins allowed to hand us a Surge token (the embedding Surge app). */
function allowedParentOrigins(): string[] {
  const configured = process.env.NEXT_PUBLIC_EMBED_PARENT_ORIGIN;
  const origins = (configured ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  // Local dev fallbacks so the iframe can be exercised from Vite dev/preview.
  if (origins.length === 0) {
    return ["http://localhost:5173", "http://localhost:4173"];
  }
  return origins;
}

/** fetch() that attaches the bridge bearer token when one is active. */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (!bridgeToken) return fetch(input, init);
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${bridgeToken}`);
  return fetch(input, { ...init, headers });
}

export interface BridgeSession {
  token: string;
  tier: "free" | "premium";
  ageVerified: boolean;
}

/** Exchange a Surge Supabase access token for a companion bearer session. */
export async function exchangeSurgeToken(
  surgeToken: string
): Promise<BridgeSession> {
  const res = await authFetch("/api/bridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ surgeToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Bridge exchange failed.");
  }
  setBridgeToken(data.token);
  return data as BridgeSession;
}

/** Tell the embedding parent we are ready to receive the Surge token. */
export function signalReady() {
  if (!isEmbedded() || window.parent === window) return;
  window.parent.postMessage({ type: "companion-ready" }, "*");
}
