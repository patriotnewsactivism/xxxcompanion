"use client";

import { useEffect, useState } from "react";
import type { Persona, Tier } from "@/lib/types";

interface ChatTurn {
  role: "user" | "assistant";
  speakerToken: string;
  content: string;
}

interface PersonaResponse {
  tier: Tier;
  presets: Persona[];
  custom: Persona[];
}

export default function ChatApp() {
  const [tier, setTier] = useState<Tier>("free");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [terminated, setTerminated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/personas");
        if (!res.ok) {
          setError("Failed to load personas.");
          return;
        }
        const data = (await res.json()) as PersonaResponse;
        if (cancelled) return;
        setTier(data.tier);
        const all = [...data.presets, ...data.custom];
        setPersonas(all);
        if (all.length > 0) setSelected(all[0].id);
      } catch {
        setError("Failed to load personas.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentPersona = personas.find((persona) => persona.id === selected);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading || terminated) return;

    const content = input.trim();
    setInput("");
    setError("");
    setLoading(true);
    setTurns((prev) => [
      ...prev,
      { role: "user", speakerToken: "user", content },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          personaId: selected,
          mode: "single",
          message: content,
        }),
      });
      const data = await res.json();

      if (res.status === 403 && data.action === "terminated") {
        setTerminated(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      setConversationId(data.conversationId);
      setTurns((prev) => [
        ...prev,
        { role: "assistant", speakerToken: data.speakerToken, content: data.reply },
      ]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      <aside className="flex w-72 flex-col border-r border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <span className="font-semibold">Companion</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              tier === "premium"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {tier === "premium" ? "Premium" : "Free"}
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelected(persona.id)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                persona.id === selected
                  ? "border-rose-500 bg-rose-500/10"
                  : "border-neutral-800 bg-neutral-800/50 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{persona.name}</span>
                {persona.premiumOnly ? (
                  <span className="text-xs text-amber-400">Premium</span>
                ) : null}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">
                {persona.tagline}
              </p>
            </button>
          ))}
        </div>

        <div className="border-t border-neutral-800 p-3 text-xs text-neutral-500">
          {tier === "free"
            ? "Free tier: text only, 20 messages/day."
            : "Premium: unlimited, voice, images, multi-character."}
        </div>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="border-b border-neutral-800 px-5 py-3">
          <h2 className="font-semibold">
            {currentPersona ? currentPersona.name : "Select a persona"}
          </h2>
          <p className="text-sm text-neutral-400">
            {currentPersona ? currentPersona.relationshipDynamic : ""}
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {turns.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              Start a conversation with {currentPersona?.name ?? "a companion"}.
            </div>
          ) : (
            turns.map((turn, index) => (
              <div
                key={index}
                className={`flex ${
                  turn.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    turn.role === "user"
                      ? "bg-rose-600 text-white"
                      : "bg-neutral-800 text-neutral-100"
                  }`}
                >
                  {turn.role === "assistant" ? (
                    <span className="mb-1 block text-xs font-medium text-neutral-400">
                      {turn.speakerToken}
                    </span>
                  ) : null}
                  {turn.content}
                </div>
              </div>
            ))
          )}
          {loading ? (
            <div className="text-sm text-neutral-500">Thinking…</div>
          ) : null}
        </div>

        {terminated ? (
          <div className="border-t border-neutral-800 p-4 text-center text-sm text-rose-400">
            This session has been terminated by the safety system.
          </div>
        ) : (
          <>
            {error ? (
              <div className="px-5 pb-2 text-sm text-rose-400">{error}</div>
            ) : null}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-3 border-t border-neutral-800 p-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}