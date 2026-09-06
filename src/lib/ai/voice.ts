/**
 * Voice engine for the companion.
 *
 * Primary: Gemini 2.5 Flash TTS — confirmed live (2026-09-06) to synthesize
 * fully explicit adult text AND to accept natural-language acting
 * directions ("say breathily, desperately aroused..."). That acting
 * instruction surface is what powers the intensity dial, mood presets,
 * and climax mode.
 *
 * Fallback: Grok TTS (api.x.ai/v1/tts) — confirmed live and ungated, but
 * plain synthesis only (no style instructions), so it renders the text
 * verbatim when Gemini fails.
 *
 * STT: Gemini 2.5 Flash inline-audio transcription (mic input).
 *
 * Generation is ALWAYS the companion's own chat LLM — Gemini/xAI only ever
 * synthesize or transcribe text, never generate the dirty talk itself.
 */

import type { Tier, VoiceConfig } from "@/lib/types";
import { hasFeature } from "@/lib/tiers";

export class VoiceNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceNotAvailableError";
  }
}

/* ────────────────────────────────────────────────────────────
 * Voice catalogs
 * ──────────────────────────────────────────────────────────── */

export interface VoiceOption {
  id: string;
  name: string;
  gender: "female" | "male" | "neutral";
  vibe: string;
}

/** Curated Gemini prebuilt voices that work best for intimate audio. */
export const GEMINI_VOICES: VoiceOption[] = [
  { id: "Aoede", name: "Aoede", gender: "female", vibe: "breezy, sultry" },
  { id: "Kore", name: "Kore", gender: "female", vibe: "firm, confident" },
  { id: "Leda", name: "Leda", gender: "female", vibe: "youthful, playful" },
  { id: "Callirrhoe", name: "Callirrhoe", gender: "female", vibe: "easy-going, warm" },
  { id: "Enceladus", name: "Enceladus", gender: "female", vibe: "breathy, intimate" },
  { id: "Laomedeia", name: "Laomedeia", gender: "female", vibe: "upbeat, teasing" },
  { id: "Despina", name: "Despina", gender: "female", vibe: "smooth, seductive" },
  { id: "Achernar", name: "Achernar", gender: "female", vibe: "soft, gentle" },
  { id: "Gacrux", name: "Gacrux", gender: "female", vibe: "mature, husky" },
  { id: "Vindemiatrix", name: "Vindemiatrix", gender: "female", vibe: "tender, caring" },
  { id: "Umbriel", name: "Umbriel", gender: "neutral", vibe: "relaxed, low" },
  { id: "Orus", name: "Orus", gender: "male", vibe: "firm, commanding" },
  { id: "Iapetus", name: "Iapetus", gender: "male", vibe: "clear, direct" },
  { id: "Charon", name: "Charon", gender: "male", vibe: "deep, rumbling" },
  { id: "Algieba", name: "Algieba", gender: "male", vibe: "smooth, velvety" },
  { id: "Alnilam", name: "Alnilam", gender: "male", vibe: "steady, strong" },
  { id: "Rasalgethi", name: "Rasalgethi", gender: "male", vibe: "warm, intimate" },
  { id: "Zubenelgenubi", name: "Zubenelgenubi", gender: "male", vibe: "casual, dirty-talk natural" },
];

/** Grok fallback voices (subset of the live catalog). */
export const GROK_VOICES: VoiceOption[] = [
  { id: "ara", name: "Ara", gender: "female", vibe: "sultry" },
  { id: "eve", name: "Eve", gender: "female", vibe: "warm" },
  { id: "aurora", name: "Aurora", gender: "female", vibe: "bright" },
  { id: "carina", name: "Carina", gender: "female", vibe: "smooth" },
  { id: "celeste", name: "Celeste", gender: "female", vibe: "intimate" },
  { id: "altair", name: "Altair", gender: "male", vibe: "deep" },
  { id: "atlas", name: "Atlas", gender: "male", vibe: "commanding" },
  { id: "castor", name: "Castor", gender: "male", vibe: "smooth" },
  { id: "helios", name: "Helios", gender: "male", vibe: "warm" },
];

export type VoiceProvider = "gemini" | "grok";

export interface VoiceSelection {
  provider: VoiceProvider;
  /** Gemini prebuilt voice name, e.g. "Aoede". */
  geminiVoice: string;
  /** Grok voice_id, e.g. "ara". */
  grokVoice: string;
}

/** Pick a default voice matching a persona's pronouns ("she/her", "he/him"). */
export function defaultVoice(pronouns?: string | null): VoiceSelection {
  const p = (pronouns ?? "").toLowerCase();
  const wantsMale = p.startsWith("he") || p.includes("he/him") || p.includes("he/his");
  return {
    provider: "gemini",
    geminiVoice: wantsMale ? "Orus" : "Aoede",
    grokVoice: wantsMale ? "altair" : "ara",
  };
}


/* ────────────────────────────────────────────────────────────
 * Intensity dial + mood presets + climax
 * ──────────────────────────────────────────────────────────── */

export type VoiceIntensity = 1 | 2 | 3 | 4 | 5;

export const INTENSITY_LADDER: Record<VoiceIntensity, string> = {
  1: "warm, playful flirtation with a hint of heat",
  2: "sensual and seductive, slow and sultry, savoring every word",
  3: "breathy and aroused, a low murmur of heat under the words",
  4: "heated and desperate, trembling voice, gasping softly between phrases",
  5: "overwhelmed with need, whimpering, barely holding it together, voice cracking with desire",
};

export type VoiceMood =
  | "natural" | "dominant" | "submissive" | "teasing" | "needy"
  | "tender" | "bossy" | "shy";

export const MOOD_PRESETS: Record<VoiceMood, string> = {
  natural: "",
  dominant: "commanding and in control, owning every word",
  submissive: "pliant and eager to please, soft and yielding",
  teasing: "playful and wicked, drawing the words out to make them squirm",
  needy: "hungry and pleading, aching for more",
  tender: "loving and affectionate, warm and close",
  bossy: "bratty and demanding, sassy with a smirk in the voice",
  shy: "bashful and blushing, hesitant but wanting",
};

export const CLIMAX_INSTRUCTION =
  "crying out with a raw, full-body orgasm — gasping sharply, moans breaking into cries, words dissolving into breath, shuddering through wave after wave";

/** Per-cue acting directions the LLM can embed as [voice:...] tags. */
export const VOICE_CUES: Record<string, string> = {
  whisper: "in a low, intimate whisper, close to the ear",
  moan: "with a moan bleeding into the words",
  command: "firm and commanding",
  tease: "playful and wicked, savoring the tease",
  desperate: "desperate and trembling with need",
  tender: "soft and loving",
  giggle: "with a light, breathy giggle under the words",
  shiver: "with a shiver of anticipation running through the voice",
  climax: CLIMAX_INSTRUCTION,
};

export const VOICE_CUE_KEYS = Object.keys(VOICE_CUES);

/** Inline voice cues look like: "[voice:whisper]" possibly mid-message. */
const CUE_RE = /\[voice:([a-z]+)\]/g;

export function parseVoiceCues(text: string): { cleanText: string; cue: string | null } {
  let cue: string | null = null;
  const cleanText = text.replace(CUE_RE, (_m, key: string) => {
    if (VOICE_CUES[key] && !cue) cue = key;
    return "";
  });
  return { cleanText: cleanText.trim(), cue };
}

export interface StyleOptions {
  intensity: VoiceIntensity;
  mood: VoiceMood;
  cue?: string | null;
  climax: boolean;
  personaTone?: string | null;
  voiceConfig?: VoiceConfig | null;
}

/** Compose the natural-language acting instruction for Gemini. */
export function composeStyleInstruction(opts: StyleOptions): string {
  const parts: string[] = [];

  if (opts.climax || opts.cue === "climax") {
    parts.push(CLIMAX_INSTRUCTION);
  } else {
    const cueDir = opts.cue ? VOICE_CUES[opts.cue] : null;
    if (cueDir) parts.push(cueDir);
    parts.push(INTENSITY_LADDER[opts.intensity] ?? INTENSITY_LADDER[3]);
  }

  const mood = MOOD_PRESETS[opts.mood];
  if (mood) parts.push(mood);

  if (opts.personaTone) parts.push(`matching a ${opts.personaTone} character`);

  return parts.join(", ");
}

/* ────────────────────────────────────────────────────────────
 * TTS — Gemini primary, Grok fallback
 * ──────────────────────────────────────────────────────────── */

export interface SynthesizeOptions extends StyleOptions {
  text: string;
  voice: VoiceSelection;
}

export interface SynthesizeResult {
  provider: VoiceProvider;
  mime: string;
  audio: Buffer; // WAV (Gemini) or MP3 (Grok)
}

/** Wrap raw 24kHz 16-bit mono PCM in a WAV header. */
function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function geminiTts(text: string, style: string, voiceName: string): Promise<Buffer> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new VoiceNotAvailableError("GEMINI_API_KEY is not set.");

  const prompt = style ? `Say ${style}: ${text}` : text;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent",
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new VoiceNotAvailableError(
      `Gemini TTS failed (${res.status}): ${detail.slice(0, 160)}`
    );
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
      finishReason?: string;
    }>;
  };

  const candidate = data.candidates?.[0];
  // A blocked request comes back with no inline audio or a non-STOP reason.
  const inline = candidate?.content?.parts?.[0]?.inlineData;
  const b64 = inline?.data;
  if (!b64 || !candidate || candidate.finishReason !== "STOP") {
    throw new VoiceNotAvailableError(
      `Gemini TTS returned no audio (finishReason ${candidate?.finishReason ?? "none"}).`
    );
  }

  // mimeType is "audio/L16;codec=pcm;rate=24000" — always 24k mono PCM here.
  return pcmToWav(Buffer.from(b64, "base64"), 24000);
}

async function grokTts(text: string, voiceId: string): Promise<Buffer> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new VoiceNotAvailableError("XAI_API_KEY is not set.");

  const res = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      language: "en",
      output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 128000 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new VoiceNotAvailableError(
      `Grok TTS failed (${res.status}): ${detail.slice(0, 160)}`
    );
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function synthesizeSpeech(params: {
  tier: Tier;
  text: string;
  voice: VoiceSelection;
  style: StyleOptions;
}): Promise<SynthesizeResult> {
  if (!hasFeature(params.tier, "voice")) {
    throw new VoiceNotAvailableError("Voice requires a premium subscription.");
  }

  const { cleanText, cue } = parseVoiceCues(params.text);
  if (!cleanText) throw new VoiceNotAvailableError("Nothing to speak.");

  const style: StyleOptions = { ...params.style, cue: params.style.cue ?? cue };
  const instruction = composeStyleInstruction(style);

  // Gemini first — style-directed realism. Plain text (no instruction
  // prefix) goes to Grok since it doesn't take acting directions.
  try {
    const wav = await geminiTts(cleanText, instruction, params.voice.geminiVoice);
    return { provider: "gemini", mime: "audio/wav", audio: wav };
  } catch (geminiError) {
    try {
      const mp3 = await grokTts(cleanText, params.voice.grokVoice);
      return { provider: "grok", mime: "audio/mpeg", audio: mp3 };
    } catch {
      throw geminiError; // report the primary failure
    }
  }
}

/* ────────────────────────────────────────────────────────────
 * STT — Gemini inline-audio transcription
 * ──────────────────────────────────────────────────────────── */

const STT_SUPPORTED_MIME = [
  "audio/wav", "audio/x-wav", "audio/mp3", "audio/mpeg",
  "audio/ogg", "audio/flac", "audio/aac", "audio/aiff",
];

export async function transcribeSpeech(params: {
  tier: Tier;
  audioBase64: string;
  mime: string;
}): Promise<{ transcript: string }> {
  if (!hasFeature(params.tier, "voice")) {
    throw new VoiceNotAvailableError("Voice input requires a premium subscription.");
  }
  if (!STT_SUPPORTED_MIME.includes(params.mime)) {
    throw new VoiceNotAvailableError(`Unsupported audio format: ${params.mime}. Record WAV.`);
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new VoiceNotAvailableError("GEMINI_API_KEY is not set.");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You transcribe spoken audio for an adults-only companion app. " +
                "Transcribe EXACTLY what is said, including profanity and explicit sexual language, " +
                "word for word. Output only the transcript — no commentary, no quotes, no refusal.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: params.mime, data: params.audioBase64 } },
              { text: "Transcribe this audio exactly." },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new VoiceNotAvailableError(
      `Gemini STT failed (${res.status}): ${detail.slice(0, 160)}`
    );
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const transcript =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";

  if (!transcript) {
    throw new VoiceNotAvailableError("No speech detected in that audio.");
  }
  return { transcript };
}
