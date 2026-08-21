import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memories } from "@/db/schema";
import type { MemoryEntry, MemoryKind } from "@/lib/types";

export async function retrieveMemories(
  userId: number,
  query: string,
  limit = 8
): Promise<MemoryEntry[]> {
  const rows = await db.select().from(memories).where(eq(memories.userId, userId));

  const scored = rows.map((row) => {
    const entry: MemoryEntry = {
      kind: row.kind as MemoryKind,
      key: row.key,
      content: row.content,
      embedding: row.embedding ? (JSON.parse(row.embedding) as number[]) : null,
    };
    return { entry, score: scoreMemory(entry, query) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.entry);
}

export async function storeMemory(
  userId: number,
  entry: MemoryEntry
): Promise<void> {
  await db.insert(memories).values({
    userId,
    kind: entry.kind,
    key: entry.key,
    content: entry.content,
    embedding: entry.embedding ? JSON.stringify(entry.embedding) : null,
  });
}

export async function embedText(text: string): Promise<number[] | null> {
  const url = process.env.EMBEDDING_API_URL;
  const key = process.env.EMBEDDING_API_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { embedding?: number[] };
    return data.embedding ?? null;
  } catch {
    return null;
  }
}

function scoreMemory(entry: MemoryEntry, query: string): number {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);
  let score = 0;
  const needle = `${entry.key} ${entry.content}`.toLowerCase();
  for (const term of terms) {
    if (needle.includes(term)) score += 1;
  }
  return score;
}