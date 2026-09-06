import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Build-safe lazy Postgres client.
 *
 * Next.js imports every API route during `next build` (page-data
 * collection), and Vercel's serverless build (bun + Turbopack) was observed
 * probing module exports with property access — which fired this Proxy's
 * get trap at module-evaluation time and turned a missing DATABASE_URL into
 * a hard BUILD error ("Failed to collect page data for /api/account",
 * 2026-09-06).
 *
 * The trap therefore never throws now. When DATABASE_URL is absent (build
 * machines, page-data collection), the client is built against a
 * well-formed placeholder URL — postgres-js only parses the URL at
 * construction and connects lazily, so nothing errors until a real query
 * runs. On the live host DATABASE_URL is present and the real client is
 * used; if it were missing there, the first query fails with a connection
 * error, which is exactly where the failure belongs.
 */

const PLACEHOLDER_URL = "postgres://companion:companion@127.0.0.1:5432/companion";

let clientInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof makeDb> | null = null;

function makeDb() {
  const url = process.env.DATABASE_URL || PLACEHOLDER_URL;
  // Transaction-mode poolers (Supabase Supavisor :6543, pgbouncer-style)
  // do not support session-level prepared statements — postgres-js must run
  // with prepare: false against them or queries fail intermittently with
  // "prepared statement does not exist" / 26000-class errors.
  const isTransactionPooler = /pooler\.[^/:]+:\d+/.test(url) && url.includes(":6543");
  clientInstance = postgres(url, {
    max: 1,
    prepare: !isTransactionPooler,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(clientInstance, { schema });
}

/** True when the runtime has a real database configured. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Proxy so existing `import { db } from "@/db"` call sites keep working
 * unchanged — the real client is created on first property access, and
 * property access is always safe to do at build time.
 */
export const db = new Proxy({} as ReturnType<typeof makeDb>, {
  get(_target, prop, receiver) {
    if (!dbInstance) dbInstance = makeDb();
    return Reflect.get(dbInstance, prop, receiver);
  },
}) as ReturnType<typeof makeDb>;
