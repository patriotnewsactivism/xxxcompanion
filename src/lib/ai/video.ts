import { hasFeature } from "@/lib/tiers";
import type { Tier } from "@/lib/types";
import { IntegrationNotConfiguredError } from "@/lib/ai/voice";

export interface GenerateAvatarVideoResult {
  provider: string;
  durationMs: number;
}

export async function generateAvatarVideo(params: {
  tier: Tier;
  personaName: string;
  audioTranscript: string;
}): Promise<GenerateAvatarVideoResult> {
  if (!hasFeature(params.tier, "video")) {
    throw new Error("Avatar video synthesis requires a premium subscription.");
  }
  if (!process.env.AVATAR_SYNTHESIS_API_KEY) {
    throw new IntegrationNotConfiguredError("Avatar synthesis");
  }
  return { provider: "avatar-synthesis", durationMs: 0 };
}