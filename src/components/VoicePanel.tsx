"use client";

/**
 * VoicePanel — voice-mode controls for premium users.
 *
 * The realism stack: Gemini 2.5 Flash TTS renders the reply with a
 * natural-language acting direction composed from the intensity dial,
 * the mood preset, and any [voice:...] cue the persona emitted. Grok
 * TTS is the ungated fallback. Mic input (push-to-talk) transcribes via
 * Gemini STT and sends as a normal message.
 */
import type { Persona } from "@/lib/types";
import type { VoiceIntensity, VoiceMood, VoiceSelection } from "@/lib/ai/voice";
import { GEMINI_VOICES, GROK_VOICES, INTENSITY_LADDER, MOOD_PRESETS } from "@/lib/ai/voice";

export const MOODS: VoiceMood[] = [
  "natural", "dominant", "submissive", "teasing",
  "needy", "tender", "bossy", "shy",
];

export const INTENSITY_LABELS: Record<VoiceIntensity, string> = {
  1: "Teasing",
  2: "Sensual",
  3: "Heated",
  4: "Desperate",
  5: "On the edge",
};

interface VoicePanelProps {
  premium: boolean;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  intensity: VoiceIntensity;
  onIntensityChange: (v: VoiceIntensity) => void;
  mood: VoiceMood;
  onMoodChange: (m: VoiceMood) => void;
  voice: VoiceSelection;
  onVoiceChange: (v: VoiceSelection) => void;
  speaking: boolean;
  onStopSpeaking: () => void;
  climaxing: boolean;
  onClimax: () => void;
  micActive: boolean;
  onMicDown: () => void;
  onMicUp: () => void;
  error: string;
}

function personaVoiceHint(persona: Persona | null): string | null {
  return persona?.voiceConfig?.geminiVoice ?? null;
}

export default function VoicePanel(props: VoicePanelProps & { persona: Persona | null }) {
  const { persona, premium } = props;

  if (!premium) {
    return (
      <div className="mx-3 mb-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
        <p className="text-xs font-semibold text-neutral-200">🎙 Voice mode</p>
        <p className="mt-1 text-xs text-neutral-400">
          Moans, whispers, dirty talk out loud — with an intensity dial and
          orgasm mode. <span className="text-amber-400">Premium feature.</span>
        </p>
      </div>
    );
  }

  const voiceByGender = (list: typeof GEMINI_VOICES, gender: string) =>
    list.filter((v) => v.gender === gender);

  return (
    <div className="mx-3 mb-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-neutral-200">🎙 Voice mode</p>
        <div className="flex items-center gap-2">
          {props.speaking && (
            <button
              type="button"
              onClick={props.onStopSpeaking}
              className="rounded px-2 py-0.5 text-[11px] text-red-400 hover:bg-neutral-800"
            >
              stop
            </button>
          )}
          <button
            type="button"
            onClick={() => props.onEnabledChange(!props.enabled)}
            className={`rounded-full px-2.5 py-0.5 font-medium ${
              props.enabled
                ? "bg-rose-500/20 text-rose-300"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {props.enabled ? "on" : "off"}
          </button>
        </div>
      </div>

      {props.enabled && (
        <div className="mt-2 space-y-2.5">
          {/* Intensity dial */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Intensity</span>
              <span className="text-rose-300">{INTENSITY_LABELS[props.intensity]}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={props.intensity}
              onChange={(e) => props.onIntensityChange(Number(e.target.value) as VoiceIntensity)}
              className="mt-1 w-full accent-rose-500"
              aria-label="Voice intensity"
            />
            <p className="text-[10px] italic text-neutral-500">
              {INTENSITY_LADDER[props.intensity]}
            </p>
          </div>

          {/* Mood presets */}
          <div className="flex flex-wrap gap-1">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => props.onMoodChange(m)}
                className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${
                  props.mood === m
                    ? "bg-rose-500/25 text-rose-200"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Voice picker */}
          <label className="block text-[11px] text-neutral-400">
            Voice
            <select
              value={props.voice.geminiVoice}
              onChange={(e) => {
                const opt = GEMINI_VOICES.find((v) => v.id === e.target.value);
                props.onVoiceChange({
                  provider: "gemini",
                  geminiVoice: e.target.value,
                  grokVoice:
                    props.voice.grokVoice ??
                    GROK_VOICES.find((g) => g.gender === (opt?.gender ?? "female"))?.id ??
                    "ara",
                });
              }}
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-neutral-200"
            >
              <optgroup label="Female">
                {voiceByGender(GEMINI_VOICES, "female").map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.vibe}
                    {personaVoiceHint(persona) === v.id ? " ✓" : ""}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Male">
                {voiceByGender(GEMINI_VOICES, "male").map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.vibe}
                    {personaVoiceHint(persona) === v.id ? " ✓" : ""}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Neutral">
                {voiceByGender(GEMINI_VOICES, "neutral").map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.vibe}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          {/* Orgasm button + push-to-talk */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={props.onClimax}
              disabled={props.climaxing}
              className="flex-1 rounded-md bg-rose-600/80 px-2 py-1.5 font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
            >
              💦 Finish me
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                props.onMicDown();
              }}
              onPointerUp={props.onMicUp}
              onPointerLeave={props.onMicUp}
              className={`rounded-md px-2.5 py-1.5 font-semibold ${
                props.micActive
                  ? "bg-amber-500 text-black"
                  : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
              }`}
              title="Hold to talk"
            >
              {props.micActive ? "recording…" : "🎙 hold"}
            </button>
          </div>

          {props.error && (
            <p className="text-[11px] text-red-400">{props.error}</p>
          )}
          <p className="text-[10px] text-neutral-600">
            Spoken by Gemini with acting directions; falls back to Grok if
            Gemini balks. Keep it in-frame — audio plays in-page.
          </p>
        </div>
      )}
    </div>
  );
}
