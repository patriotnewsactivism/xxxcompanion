import { hasFeature } from "@/lib/tiers";
import type { Tier } from "@/lib/types";
import { IntegrationNotConfiguredError } from "@/lib/ai/errors";

export interface GenerateImageResult {
  provider: string;
  width: number;
  height: number;
}

export async function generateCharacterStill(params: {
  tier: Tier;
  personaName: string;
  prompt: string;
}): Promise<GenerateImageResult> {
  if (!hasFeature(params.tier, "image")) {
    throw new Error("Image generation requires a premium subscription.");
  }
  if (!process.env.STABILITY_API_KEY) {
    throw new IntegrationNotConfiguredError("Stability AI");
  }
  return { provider: "stability", width: 1024, height: 1024 };
}