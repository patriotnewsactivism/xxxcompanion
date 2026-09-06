import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { personas } from "@/db/schema";
import { getSessionUserForRequest } from "@/lib/session";
import { rowToPersona } from "@/lib/persona/mapping";
import { isTier } from "@/lib/tiers";
import {
  synthesizeSpeech,
  VoiceNotAvailableError,
  type VoiceIntensity,
  type VoiceMood,
  type VoiceSelection,
} from "@/lib/ai/voice";

/**
 * POST /api/voice/tts
 * Body: {
 *   text: string;              // may contain [voice:...] cue tags
 *   personaId?: string;        // persona tone + stored voice selection
 *   voice?: { geminiVoice, grokVoice };   // per-request override
 *   intensity?: 1..5;          // session dial
 *   mood?: VoiceMood;          // session preset
 *   climax?: boolean;          // explicit climax render
 * }
 * Returns: binary audio (audio/wav from Gemini, audio/mpeg from Grok)
 * with X-Voice-Provider + X-Voice-Cue headers.
 */
export async function POST(request: Request) {
  let body: {
    text?: string;
    personaId?: string;
    voice?: Partial<VoiceSelection>;
    intensity?: number;
    mood?: string;
    climax?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const user = await getSessionUserForRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Age verification required." }, { status: 403 });
  }
  if (user.terminated) {
    return NextResponse.json({ error: "Account terminated." }, { status: 403 });
  }

  const tier = user.tier && isTier(user.tier) ? user.tier : "free";
  if (tier !== "premium") {
    return NextResponse.json(
      { error: "Voice is a premium feature." },
      { status: 402 }
    );
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Nothing to speak." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "Text too long for one utterance." }, { status: 400 });
  }

  // Resolve persona (for tone + persisted voice selection) when given.
  let personaTone: string | null = null;
  let personaVoice: Partial<VoiceSelection> = {};
  if (body.personaId) {
    try {
      const numericId = Number(body.personaId);
      if (Number.isInteger(numericId) && numericId > 0) {
        const rows = await db
          .select()
          .from(personas)
          .where(and(eq(personas.id, numericId), eq(personas.userId, user.id)));
        const row = rows[0];
        if (row) {
          const persona = rowToPersona(row);
          personaTone = persona.tone;
          if (persona.voiceConfig) {
            personaVoice = persona.voiceConfig as Partial<VoiceSelection>;
          }
        }
      }
    } catch {
      // Persona lookup is best-effort — the request can still succeed.
    }
  }

  const voice: VoiceSelection = {
    provider: (body.voice?.provider ?? personaVoice.provider ?? "gemini") as VoiceSelection["provider"],
    geminiVoice: body.voice?.geminiVoice ?? personaVoice.geminiVoice ?? "Aoede",
    grokVoice: body.voice?.grokVoice ?? personaVoice.grokVoice ?? "ara",
  };

  const intensity = Math.min(5, Math.max(1, Math.round(body.intensity ?? 3))) as VoiceIntensity;
  const validMoods: VoiceMood[] = [
    "natural", "dominant", "submissive", "teasing", "needy",
    "tender", "bossy", "shy",
  ];
  const mood = (validMoods as string[]).includes(body.mood ?? "")
    ? (body.mood as VoiceMood)
    : "natural";

  try {
    const result = await synthesizeSpeech({
      tier,
      text,
      voice,
      style: {
        intensity,
        mood,
        climax: Boolean(body.climax),
        personaTone,
      },
    });

    return new NextResponse(new Uint8Array(result.audio), {
      status: 200,
      headers: {
        "Content-Type": result.mime,
        "X-Voice-Provider": result.provider,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof VoiceNotAvailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("voice tts error", err);
    return NextResponse.json({ error: "Voice synthesis failed." }, { status: 500 });
  }
}
