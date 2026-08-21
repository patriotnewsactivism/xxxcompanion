import { hasFeature } from "@/lib/tiers";
import type { Tier, VoiceConfig } from "@/lib/types";

export class IntegrationNotConfiguredError extends Error {
  constructor(service: string) {
    super(`${service} is not configured. Set the required environment variables.`);
    this.name = "IntegrationNotConfiguredError";
  }
}

export interface SynthesizeResult {
  provider: string;
  status: "ok";
}

export interface TranscribeResult {
  provider: string;
  transcript: string;
}

export async function synthesizeSpeech(params: {
  tier: Tier;
  text: string;
  config?: VoiceConfig;
}): Promise<SynthesizeResult> {
  if (!hasFeature(params.tier, "voice")) {
    throw new Error("Voice streaming requires a premium subscription.");
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new IntegrationNotConfiguredError("ElevenLabs");
  }
  return { provider: "elevenlabs", status: "ok" };
}

export async function transcribeSpeech(params: {
  tier: Tier;
  audioBase64: string;
}): Promise<TranscribeResult> {
  if (!hasFeature(params.tier, "voice")) {
    throw new Error("Voice input requires a premium subscription.");
  }
  if (!process.env.DEEPGRAM_API_KEY) {
    throw new IntegrationNotConfiguredError("Deepgram");
  }
  return { provider: "deepgram", transcript: "" };
}