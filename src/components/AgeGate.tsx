"use client";

import { useState } from "react";

export default function AgeGate() {
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!consent) {
      setError("Please confirm you are 18 or older.");
      return;
    }
    if (!dateOfBirth) {
      setError("Please enter your date of birth.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateOfBirth, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setLoading(false);
        return;
      }
      window.location.href = "/chat";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
            Companion
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            An erotic AI companion for verified adults.
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Fictional characters, real chemistry — your kinks, your limits,
            your fantasies.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="dob"
              className="block text-sm font-medium text-neutral-300"
            >
              Date of birth
            </label>
            <input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:border-rose-500"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-800 accent-rose-500"
            />
            <span>
              I confirm that I am 18 years of age or older (21+ where required by
              law) and that I consent to viewing adult-oriented content.
            </span>
          </label>

          {error ? (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-rose-600 px-4 py-2.5 font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Access requires verified age. Identity verification is handled by
          trusted third-party providers.
        </p>
      </div>
    </main>
  );
}