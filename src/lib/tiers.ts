import type { Tier, TierFeature } from "@/lib/types";

export const DAILY_MESSAGE_LIMIT: Record<Tier, number> = {
  free: 20,
  premium: Number.POSITIVE_INFINITY,
};

export const TIER_FEATURES: Record<Tier, TierFeature[]> = {
  free: ["text"],
  premium: [
    "text",
    "longTermMemory",
    "voice",
    "image",
    "video",
    "multiCharacter",
    "customPersona",
  ],
};

export function hasFeature(tier: Tier, feature: TierFeature): boolean {
  return TIER_FEATURES[tier]?.includes(feature) ?? false;
}

export function isTier(value: string): value is Tier {
  return value === "free" || value === "premium";
}