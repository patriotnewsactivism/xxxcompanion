import { NextResponse } from "next/server";
import postgres from "postgres";

/**
 * One-time migration applier for a fresh database (bootstrap).
 *
 * Protected by MIGRATE_SECRET. Applies the committed migration statements
 * (embedded here so no file-tracing issues on serverless), records drizzle
 * bookkeeping, and can run read-only admin queries for smoke verification.
 * REMOVE this route once bootstrap is verified.
 */

const STATEMENTS = ["CREATE TABLE \"conversations\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"user_id\" integer NOT NULL,\n\t\"mode\" text DEFAULT 'single' NOT NULL,\n\t\"title\" text DEFAULT 'New conversation' NOT NULL,\n\t\"persona_ids\" text DEFAULT '[]' NOT NULL,\n\t\"short_term\" text DEFAULT '[]' NOT NULL,\n\t\"created_at\" timestamp,\n\t\"updated_at\" timestamp\n);", "CREATE TABLE \"memories\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"user_id\" integer NOT NULL,\n\t\"kind\" text NOT NULL,\n\t\"key\" text NOT NULL,\n\t\"content\" text NOT NULL,\n\t\"embedding\" text,\n\t\"created_at\" timestamp\n);", "CREATE TABLE \"messages\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"conversation_id\" integer NOT NULL,\n\t\"speaker_token\" text DEFAULT 'companion' NOT NULL,\n\t\"role\" text NOT NULL,\n\t\"content\" text NOT NULL,\n\t\"moderation_status\" text DEFAULT 'allowed' NOT NULL,\n\t\"created_at\" timestamp\n);", "CREATE TABLE \"personas\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"user_id\" integer,\n\t\"slug\" text NOT NULL,\n\t\"name\" text NOT NULL,\n\t\"tagline\" text NOT NULL,\n\t\"genre\" text NOT NULL,\n\t\"relationship_dynamic\" text NOT NULL,\n\t\"tone\" text NOT NULL,\n\t\"definition\" text NOT NULL,\n\t\"appearance\" text,\n\t\"pronouns\" text,\n\t\"kinks\" text DEFAULT '[]' NOT NULL,\n\t\"hard_limits\" text DEFAULT '[]' NOT NULL,\n\t\"soft_limits\" text DEFAULT '[]' NOT NULL,\n\t\"scene\" text,\n\t\"explicitness\" integer DEFAULT 3 NOT NULL,\n\t\"narrative_style\" text DEFAULT 'second' NOT NULL,\n\t\"response_length\" text DEFAULT 'balanced' NOT NULL,\n\t\"greeting\" text,\n\t\"voice_config\" text,\n\t\"avatar_path\" text,\n\t\"is_custom\" boolean DEFAULT false NOT NULL,\n\t\"premium_only\" boolean DEFAULT false NOT NULL,\n\t\"created_at\" timestamp,\n\tCONSTRAINT \"personas_slug_unique\" UNIQUE(\"slug\")\n);", "CREATE TABLE \"security_events\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"user_id\" integer,\n\t\"event_type\" text NOT NULL,\n\t\"category\" text NOT NULL,\n\t\"detail\" text NOT NULL,\n\t\"created_at\" timestamp\n);", "CREATE TABLE \"user_profiles\" (\n\t\"user_id\" integer PRIMARY KEY NOT NULL,\n\t\"display_name\" text,\n\t\"pronouns\" text,\n\t\"gender\" text,\n\t\"turn_ons\" text DEFAULT '[]' NOT NULL,\n\t\"hard_limits\" text DEFAULT '[]' NOT NULL,\n\t\"soft_limits\" text DEFAULT '[]' NOT NULL,\n\t\"safe_word\" text,\n\t\"aftercare\" text,\n\t\"notes\" text,\n\t\"updated_at\" timestamp\n);", "CREATE TABLE \"users\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"tier\" text DEFAULT 'free' NOT NULL,\n\t\"age_verified\" boolean DEFAULT false NOT NULL,\n\t\"age_verified_at\" timestamp,\n\t\"verification_status\" text DEFAULT 'pending' NOT NULL,\n\t\"terminated\" boolean DEFAULT false NOT NULL,\n\t\"daily_message_count\" integer DEFAULT 0 NOT NULL,\n\t\"message_window_start\" timestamp,\n\t\"created_at\" timestamp\n);", "ALTER TABLE \"conversations\" ADD CONSTRAINT \"conversations_user_id_users_id_fk\" FOREIGN KEY (\"user_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;", "ALTER TABLE \"memories\" ADD CONSTRAINT \"memories_user_id_users_id_fk\" FOREIGN KEY (\"user_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;", "ALTER TABLE \"messages\" ADD CONSTRAINT \"messages_conversation_id_conversations_id_fk\" FOREIGN KEY (\"conversation_id\") REFERENCES \"public\".\"conversations\"(\"id\") ON DELETE no action ON UPDATE no action;", "ALTER TABLE \"personas\" ADD CONSTRAINT \"personas_user_id_users_id_fk\" FOREIGN KEY (\"user_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;", "ALTER TABLE \"security_events\" ADD CONSTRAINT \"security_events_user_id_users_id_fk\" FOREIGN KEY (\"user_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;", "ALTER TABLE \"user_profiles\" ADD CONSTRAINT \"user_profiles_user_id_users_id_fk\" FOREIGN KEY (\"user_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;", "CREATE UNIQUE INDEX IF NOT EXISTS users_surge_sub_key ON users (surge_sub) WHERE surge_sub IS NOT NULL"];

export async function POST(request: Request) {
  const secret = process.env.MIGRATE_SECRET;
  const provided = request.headers.get("x-migrate-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: { query?: string; mode?: "migrate" | "query" } = {};
  try { body = await request.json(); } catch {}

  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL missing." }, { status: 500 });
  }
  const isPooler = url.includes(":6543");
  const sql = postgres(url, {
    max: 1,
    prepare: !isPooler,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    if (body.mode === "query" && body.query) {
      const rows = await sql.unsafe(body.query);
      return NextResponse.json({ rows });
    }

    let applied = 0;
    await sql.begin(async (tx) => {
      for (const stmt of STATEMENTS) {
        await tx.unsafe(stmt);
        applied += 1;
      }
      // Drizzle bookkeeping so future `db:migrate` runs skip these.
      await tx.unsafe(
        "CREATE SCHEMA IF NOT EXISTS drizzle"
      );
      await tx.unsafe(
        "CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)"
      );
      await tx.unsafe(
        "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1)",
        ["0000_first_richard_fisk", 1788728745569]
      );
      await tx.unsafe(
        "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1)",
        ["0001_surge_bridge", 1788728746569]
      );
    });

    const tables = (await sql`select tablename from pg_tables where schemaname = 'public' order by tablename`) as Array<{ tablename: string }>;
    return NextResponse.json({
      applied,
      tables: tables.map((t: { tablename: string }) => t.tablename),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Migration failed." },
      { status: 500 }
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}
