import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages, personas, users } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { buildSystemPrompt } from "@/lib/persona/prompt";
import { findPresetPersona, PRESET_PERSONAS } from "@/lib/persona/presets";
import { moderateInput, moderateOutput } from "@/lib/safety/moderation";
import { logSecurityEvent } from "@/lib/safety/securityLog";
import { DAILY_MESSAGE_LIMIT, hasFeature, isTier } from "@/lib/tiers";
import { toShortTermContext } from "@/lib/memory/shortTerm";
import { retrieveMemories } from "@/lib/memory/longTerm";
import { generateChat } from "@/lib/ai/provider";
import type {
  ChatMessage,
  ChatResponse,
  ConversationMode,
  Persona,
  Tier,
} from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  let body: {
    conversationId?: number;
    personaId?: string;
    mode?: ConversationMode;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Age verification required." },
      { status: 403 }
    );
  }
  if (user.terminated) {
    return NextResponse.json(
      { error: "This account has been permanently terminated." },
      { status: 403 }
    );
  }
  if (!user.ageVerified) {
    return NextResponse.json(
      { error: "Age verification required." },
      { status: 403 }
    );
  }

  const tier: Tier = isTier(user.tier) ? user.tier : "free";
  const mode: ConversationMode = body.mode === "group" ? "group" : "single";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  if (mode === "group" && !hasFeature(tier, "multiCharacter")) {
    return NextResponse.json(
      { error: "Multi-character rooms require a premium subscription." },
      { status: 403 }
    );
  }

  let persona: Persona | null = null;
  if (body.personaId) {
    persona = findPresetPersona(body.personaId) ?? null;
    if (!persona) {
      const numericId = Number(body.personaId);
      if (Number.isInteger(numericId) && numericId > 0) {
        const rows = await db
          .select()
          .from(personas)
          .where(and(eq(personas.id, numericId), eq(personas.userId, user.id)));
        const row = rows[0];
        if (row) {
          persona = {
            id: `custom-${row.id}`,
            name: row.name,
            tagline: row.tagline,
            genre: row.genre,
            relationshipDynamic: row.relationshipDynamic,
            tone: row.tone,
            definition: row.definition,
            voiceConfig: row.voiceConfig
              ? (JSON.parse(row.voiceConfig) as Persona["voiceConfig"])
              : undefined,
            avatarPath: row.avatarPath,
            isCustom: row.isCustom,
            premiumOnly: row.premiumOnly,
          };
        }
      }
    }
  }

  if (mode === "single" && !persona) {
    return NextResponse.json(
      { error: "A valid persona is required." },
      { status: 400 }
    );
  }
  if (!persona) persona = PRESET_PERSONAS[0];
  if (persona.premiumOnly && tier !== "premium") {
    return NextResponse.json(
      { error: "This persona requires a premium subscription." },
      { status: 403 }
    );
  }

  const now = new Date();
  let count = user.dailyMessageCount;
  let windowStart = user.messageWindowStart;
  if (!windowStart || now.getTime() - windowStart.getTime() >= DAY_MS) {
    count = 0;
    windowStart = now;
  }
  if (count >= DAILY_MESSAGE_LIMIT[tier]) {
    return NextResponse.json(
      { error: "Daily message limit reached. Upgrade for unlimited messaging." },
      { status: 429 }
    );
  }

  const inputModeration = await moderateInput(message);
  if (inputModeration.action !== "allow") {
    const termination = inputModeration.action === "terminate";
    await logSecurityEvent({
      userId: user.id,
      eventType: termination ? "session_terminated" : "message_blocked",
      category: inputModeration.categories[0] ?? "unknown",
      detail: message.slice(0, 300),
    });
    if (termination) {
      await db.update(users).set({ terminated: true }).where(eq(users.id, user.id));
      const response = NextResponse.json(
        { error: "Session terminated by safety policy.", action: "terminated" },
        { status: 403 }
      );
      response.cookies.delete("age_verified");
      return response;
    }
    return NextResponse.json(
      { error: "Message blocked by safety policy.", action: "blocked" },
      { status: 403 }
    );
  }

  let conversationId = body.conversationId;
  let personaIds: string[] = [];

  if (conversationId) {
    const rows = await db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.id, conversationId), eq(conversations.userId, user.id))
      );
    const convo = rows[0];
    if (convo) {
      conversationId = convo.id;
      personaIds = JSON.parse(convo.personaIds) as string[];
    } else {
      conversationId = undefined;
    }
  }

  if (!conversationId) {
    personaIds = [persona.id];
    const inserted = await db
      .insert(conversations)
      .values({
        userId: user.id,
        mode,
        title: persona.name,
        personaIds: JSON.stringify(personaIds),
      })
      .returning({ id: conversations.id });
    conversationId = inserted[0].id;
  }

  const recentRows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(50);
  const recentMessages: ChatMessage[] = toShortTermContext(
    recentRows.reverse().map((row) => ({
      speakerToken: row.speakerToken,
      role: row.role as ChatMessage["role"],
      content: row.content,
    }))
  );

  await db.insert(messages).values({
    conversationId,
    speakerToken: "user",
    role: "user",
    content: message,
    moderationStatus: "allowed",
  });

  const memories = hasFeature(tier, "longTermMemory")
    ? await retrieveMemories(user.id, message)
    : [];

  const system = buildSystemPrompt({
    persona,
    personaIds,
    mode,
    memories,
    shortTerm: recentMessages,
  });

  const generated = await generateChat({
    system,
    messages: recentMessages.concat([{ role: "user", content: message }]),
    assistantName: persona.name,
  });

  let reply: string;
  let action: ChatResponse["action"];
  const outputModeration = await moderateOutput(generated);
  if (outputModeration.action !== "allow") {
    await logSecurityEvent({
      userId: user.id,
      eventType: "output_blocked",
      category: outputModeration.categories[0] ?? "unknown",
      detail: generated.slice(0, 300),
    });
    reply = "I want to keep things comfortable for both of us. Let's talk about something lighter.";
    action = "blocked";
  } else {
    reply = generated;
    action = "delivered";
  }

  const speakerToken = mode === "group" ? "group" : persona.name;

  await db.insert(messages).values({
    conversationId,
    speakerToken,
    role: "assistant",
    content: reply,
    moderationStatus: action === "delivered" ? "allowed" : "blocked",
  });

  await db
    .update(conversations)
    .set({
      updatedAt: now,
      shortTerm: JSON.stringify(
        toShortTermContext(
          recentMessages.concat(
            { role: "user", content: message },
            { role: "assistant", content: reply }
          )
        )
      ),
    })
    .where(eq(conversations.id, conversationId));

  await db
    .update(users)
    .set({ dailyMessageCount: count + 1, messageWindowStart: windowStart })
    .where(eq(users.id, user.id));

  const response: ChatResponse = {
    reply,
    speakerToken,
    conversationId,
    action,
  };

  return NextResponse.json(response);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";