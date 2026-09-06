"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "@/lib/bridgeClient";
import { blobToBase64, firstVoiceCue, stripVoiceCues, WavRecorder } from "@/lib/wavRecorder";
import { defaultVoice, type VoiceIntensity, type VoiceMood, type VoiceSelection } from "@/lib/ai/voice";
import VoicePanel from "@/components/VoicePanel";
import type { ChatResponse, Persona, Tier } from "@/lib/types";
import { EXPLICITNESS_LABELS } from "@/lib/persona/options";
import { kinkLabel } from "@/lib/kinks/taxonomy";
import PersonaEditor from "@/components/PersonaEditor";
import ProfileDrawer from "@/components/ProfileDrawer";

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

type ChatApiResponse = ChatResponse & { error?: string };

function humanize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ChatApp() {
  const [tier, setTier] = useState<Tier>("free");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selected, setSelected] = useState("");
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [terminated, setTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState<string | null>(
    null,
  );
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [intensity, setIntensity] = useState<VoiceIntensity>(2);
  const [mood, setMood] = useState<VoiceMood>("natural");
  const [voiceByPersona, setVoiceByPersona] = useState<Record<string, VoiceSelection>>({});
  const [speaking, setSpeaking] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [climaxing, setClimaxing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<WavRecorder | null>(null);
  const pendingClimaxRef = useRef(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch("/api/personas");
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
  const currentVoice: VoiceSelection =
    (selected && voiceByPersona[selected]) ||
    (currentPersona?.voiceConfig?.geminiVoice
      ? {
          provider: "gemini",
          geminiVoice: currentPersona.voiceConfig.geminiVoice,
          grokVoice: currentPersona.voiceConfig.grokVoice ?? "ara",
        }
      : defaultVoice(currentPersona?.pronouns));

  function setVoiceForPersona(next: VoiceSelection) {
    if (!selected) return;
    setVoiceByPersona((prev) => {
      const updated = { ...prev, [selected]: next };
      try {
        localStorage.setItem("companion.voices", JSON.stringify(updated));
      } catch {
        // localStorage unavailable (private mode) — session-only is fine.
      }
      return updated;
    });
  }

  // Restore per-persona voice picks.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("companion.voices");
      if (raw) setVoiceByPersona(JSON.parse(raw));
    } catch {
      // ignore malformed cache
    }
  }, []);

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  async function speakReply(text: string) {
    const climax = pendingClimaxRef.current;
    pendingClimaxRef.current = false;
    try {
      setSpeaking(true);
      const res = await authFetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          personaId: selected,
          voice: currentVoice,
          intensity,
          mood,
          climax,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setVoiceError(data.error ?? "Voice failed.");
        return;
      }
      setVoiceError("");
      const blob = await res.blob();
      stopSpeaking();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      await audio.play();
    } catch {
      setVoiceError("Voice network error.");
    } finally {
      if (!audioRef.current) setSpeaking(false);
    }
  }

  function handleNewChat() {
    setConversationId(undefined);
    setTurns([]);
    setTerminated(false);
    setTerminationReason(null);
    setError("");
  }

  function handlePersonaCreated(persona: Persona) {
    setPersonas((prev) => [...prev, persona]);
    setSelected(persona.id);
    handleNewChat();
  }

  async function sendMessage(content: string, opts?: { climax?: boolean }) {
    if (!content.trim() || loading || terminated || !currentPersona) return;

    if (opts?.climax) pendingClimaxRef.current = true;
    setInput("");
    setError("");
    setLoading(true);
    setTurns((prev) => [
      ...prev,
      { role: "user", speakerToken: "user", content },
    ]);

    try {
      const res = await authFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          personaId: selected,
          mode: "single",
          message: content,
          voiceMode: voiceEnabled,
        }),
      });
      const data = (await res.json()) as ChatApiResponse;

      if (res.status === 403 && data.action === "terminated") {
        setTerminated(true);
        setTerminationReason(data.reason ?? null);
        return;
      }
      if (data.action === "blocked") {
        setError(data.reason ?? "That message was blocked. Adjust it and try again.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? data.reason ?? "Something went wrong.");
        return;
      }

      setConversationId(data.conversationId);
      setTurns((prev) => [
        ...prev,
        { role: "assistant", speakerToken: data.speakerToken, content: data.reply },
      ]);
      if (voiceEnabled) {
        void speakReply(data.reply);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;
    await sendMessage(content);
  }

  async function handleClimax() {
    if (loading || !currentPersona || climaxing) return;
    setClimaxing(true);
    try {
      await sendMessage(
        "Take me over the edge — I want you to make me come, right now.",
        { climax: true }
      );
    } finally {
      setClimaxing(false);
    }
  }

  async function handleMicDown() {
    setVoiceError("");
    try {
      if (!recorderRef.current) recorderRef.current = new WavRecorder();
      await recorderRef.current.start();
      setMicActive(true);
    } catch {
      setVoiceError("Microphone unavailable.");
    }
  }

  async function handleMicUp() {
    if (!micActive || !recorderRef.current?.isRecording) return;
    setMicActive(false);
    try {
      const blob = await recorderRef.current.stop();
      if (blob.size < 2000) {
        setVoiceError("Too short — hold the button while you talk.");
        return;
      }
      const audioBase64 = await blobToBase64(blob);
      const res = await authFetch("/api/voice/stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mime: "audio/wav" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setVoiceError(data.error ?? "Transcription failed.");
        return;
      }
      const data = (await res.json()) as { transcript: string };
      if (data.transcript?.trim()) {
        await sendMessage(data.transcript.trim());
      }
    } catch {
      setVoiceError("Voice input failed.");
    }
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      <aside className="flex w-80 flex-col border-r border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <span className="font-semibold tracking-tight text-neutral-50">
            Companion
          </span>
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

        <p className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Companions
        </p>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {personas.length === 0 ? (
            <p className="px-1 py-2 text-sm text-neutral-500">
              No companions yet — create your first one.
            </p>
          ) : (
            personas.map((persona) => (
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
                  <span className="font-medium text-neutral-100">
                    {persona.name}
                  </span>
                  {persona.premiumOnly ? (
                    <span className="text-xs font-medium text-amber-400">
                      Premium
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">
                  {persona.tagline}
                </p>
                {persona.kinks.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {persona.kinks.slice(0, 3).map((kink) => (
                      <span
                        key={kink}
                        className="rounded-full border border-neutral-700/80 bg-neutral-900/60 px-1.5 py-0.5 text-[10px] text-neutral-500"
                      >
                        {kinkLabel(kink)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            ))
          )}
        </div>

        <div className="border-t border-neutral-800 p-3">
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
            >
              New companion
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
            >
              Your profile
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            {tier === "free"
              ? "Text, 20 msgs/day. Custom companions on Premium."
              : "Premium: everything unlocked — custom companions included."}
          </p>
        </div>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-800 px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-neutral-50">
              {currentPersona ? currentPersona.name : "Companion"}
            </h2>
            <p className="text-sm text-neutral-400">
              {currentPersona
                ? humanize(currentPersona.relationshipDynamic)
                : "Pick a companion"}
            </p>
            {currentPersona ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-300">
                  Heat {currentPersona.explicitness} ·{" "}
                  {EXPLICITNESS_LABELS[currentPersona.explicitness].split(" — ")[0]}
                </span>
                {currentPersona.scene?.location ? (
                  <span className="max-w-56 truncate rounded-full border border-neutral-700 bg-neutral-800/60 px-2.5 py-0.5 text-xs text-neutral-400">
                    {currentPersona.scene.location}
                  </span>
                ) : null}
                {currentPersona.premiumOnly ? (
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                    Premium
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          {currentPersona ? (
            <button
              type="button"
              onClick={handleNewChat}
              className="shrink-0 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:bg-neutral-800"
            >
              New chat
            </button>
          ) : null}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {turns.length === 0 ? (
            personas.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                No companions yet — create your first one.
              </div>
            ) : currentPersona?.greeting ? (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl bg-neutral-800 px-4 py-2.5 text-sm text-neutral-100">
                  <span className="mb-1 block text-xs font-medium text-neutral-400">
                    {currentPersona.name}
                  </span>
                  <p className="whitespace-pre-wrap">{currentPersona.greeting}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Opening line — send your first message to begin.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-500">
                Pick a companion. Set your profile. Explore whatever fantasy
                the two of you want.
              </div>
            )
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
                  <p className="whitespace-pre-wrap">{stripVoiceCues(turn.content)}</p>
                  {turn.role === "assistant" && firstVoiceCue(turn.content) ? (
                    <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-rose-300/70">
                      🎙 {firstVoiceCue(turn.content)}
                    </span>
                  ) : null}
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
            {terminationReason ??
              "This session has been terminated by the safety system."}
          </div>
        ) : (
          <>
            <VoicePanel
              persona={currentPersona ?? null}
              premium={tier === "premium"}
              enabled={voiceEnabled}
              onEnabledChange={(v) => {
                setVoiceEnabled(v);
                if (!v) stopSpeaking();
              }}
              intensity={intensity}
              onIntensityChange={setIntensity}
              mood={mood}
              onMoodChange={setMood}
              voice={currentVoice}
              onVoiceChange={setVoiceForPersona}
              speaking={speaking}
              onStopSpeaking={stopSpeaking}
              climaxing={climaxing}
              onClimax={handleClimax}
              micActive={micActive}
              onMicDown={handleMicDown}
              onMicUp={handleMicUp}
              error={voiceError}
            />
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
                placeholder={currentPersona ? "Write a message…" : "Pick a companion first"}
                disabled={!currentPersona}
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-500 focus:border-rose-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !currentPersona}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        )}
      </section>

      <PersonaEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        tier={tier}
        onCreated={handlePersonaCreated}
      />
      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}