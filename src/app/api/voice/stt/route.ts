import { NextResponse } from "next/server";
import { getSessionUserForRequest } from "@/lib/session";
import { isTier } from "@/lib/tiers";
import { transcribeSpeech, VoiceNotAvailableError } from "@/lib/ai/voice";

/**
 * POST /api/voice/stt
 * Body: { audioBase64: string; mime: string }
 * Returns: { transcript: string }
 */
export async function POST(request: Request) {
  let body: { audioBase64?: string; mime?: string };
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
      { error: "Voice input is a premium feature." },
      { status: 402 }
    );
  }

  if (!body.audioBase64 || !body.mime) {
    return NextResponse.json({ error: "audioBase64 and mime are required." }, { status: 400 });
  }
  if (body.audioBase64.length > 12_000_000) {
    return NextResponse.json({ error: "Recording too long." }, { status: 400 });
  }

  try {
    const { transcript } = await transcribeSpeech({
      tier,
      audioBase64: body.audioBase64,
      mime: body.mime,
    });
    return NextResponse.json({ transcript });
  } catch (err) {
    if (err instanceof VoiceNotAvailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("voice stt error", err);
    return NextResponse.json({ error: "Transcription failed." }, { status: 500 });
  }
}
