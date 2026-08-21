import { db } from "@/db";
import { securityEvents } from "@/db/schema";

export interface SecurityEventInput {
  userId?: number | null;
  eventType: string;
  category: string;
  detail: string;
}

export async function logSecurityEvent(input: SecurityEventInput): Promise<void> {
  console.warn(`[security] ${input.eventType}: ${input.detail.slice(0, 240)}`);
  try {
    await db.insert(securityEvents).values({
      userId: input.userId ?? null,
      eventType: input.eventType,
      category: input.category,
      detail: input.detail.slice(0, 500),
    });
  } catch (error) {
    console.error("[security] failed to persist event", error);
  }
}