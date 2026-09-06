"use client";

import { useCallback, useEffect, useState } from "react";
import ChatApp from "@/components/ChatApp";
import { exchangeSurgeToken, signalReady, type BridgeSession } from "@/lib/bridgeClient";

type Phase = "waiting" | "age" | "ready" | "error";

/**
 * Embedded entry for Surge. The parent window (Surge, premium-gated tab)
 * loads this URL in an iframe and hands us the user's Supabase access token
 * via postMessage once we signal readiness. Everything after that runs on
 * the bearer token — no cookies, so third-party cookie blocking is moot.
 */

function allowedParentOriginsPublic(): string[] {
  const configured = process.env.NEXT_PUBLIC_EMBED_PARENT_ORIGIN;
  const origins = (configured ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    return ["http://localhost:5173", "http://localhost:4173"];
  }
  return origins;
}

function AgeConfirm({ onDone }: { onDone: () => void }) {
  const [dob, setDob] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!consent) return setError("Please confirm you are 18 or older.");
    if (!dob) return setError("Please enter your date of birth.");
    setBusy(true);
    setError("");
    try {
      const { authFetch } = await import("@/lib/bridgeClient");
      const res = await authFetch("/api/verify-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateOfBirth: dob, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setBusy(false);
        return;
      }
      onDone();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-6">
        <h1 className="text-xl font-bold text-white">
          One last thing — age verification
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Your AI Companion creates explicit adult content. Confirm your date
          of birth to continue.
        </p>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="mt-4 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-white"
        />
        <label className="mt-3 flex items-start gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          I am 18 or older and consent to viewing explicit adult content.
        </label>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-white px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Verifying…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [session, setSession] = useState<BridgeSession | null>(null);
  const [error, setError] = useState("");

  const start = useCallback(async (surgeToken: string) => {
    try {
      const s = await exchangeSurgeToken(surgeToken);
      setSession(s);
      setPhase(s.ageVerified ? "ready" : "age");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bridge failed.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    const allowed = allowedParentOriginsPublic();
    function onMessage(event: MessageEvent) {
      if (!allowed.includes(event.origin)) return;
      if (event.data?.type === "surge-token" && event.data.token) {
        start(event.data.token);
      }
    }
    window.addEventListener("message", onMessage);
    signalReady();
    // Some parents send the token before listening for our ready signal —
    // nudge them again so the handshake always completes.
    const retry = setTimeout(signalReady, 1500);
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(retry);
    };
  }, [start]);

  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="max-w-sm text-center">
          <p className="text-white font-semibold">Companion unavailable</p>
          <p className="mt-2 text-sm text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-sm text-neutral-500 animate-pulse">
          Connecting your companion…
        </p>
      </div>
    );
  }

  if (phase === "age") {
    return <AgeConfirm onDone={() => setPhase("ready")} />;
  }

  return <ChatApp />;
}
