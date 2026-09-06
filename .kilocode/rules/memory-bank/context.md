# Context Memory Bank

## Current State

Data layer is now Supabase Postgres: Drizzle `pg-core` schema (7 tables:
users, personas, conversations, messages, memories, security_events,
user_profiles), `postgres-js` driver, `DATABASE_URL`-gated client. The SQLite
`@kilocode/app-builder-db` stack (DB_URL/DB_TOKEN) was removed. Migration
`0000_first_richard_fisk` was fresh-generated in Postgres dialect (serial PKs,
boolean/timestamp columns) but is **NOT yet applied** — the user must set
`DATABASE_URL` in Vercel project env + `.env.local`, then run
`bun run db:migrate` (direct URI) or paste the SQL into the Supabase SQL
Editor. `.env.example` committed with Supabase connection notes. `bun typecheck`
and `bun lint` are fully green.

## Recently Completed

- [x] Committed + pushed erotica feature wave (persona engine, kink taxonomy, 9 personas, erotic prompt builder, chat UI rewrite with persona editor/profile drawer/kink picker, legality-only moderation, adult-first provider chain, legal pages, user_profiles + migration 0001) — commit `87c51a9`
- [x] Switched data layer to Supabase Postgres: removed `@kilocode/app-builder-db`, added `postgres`; `src/db/schema.ts` converted SQLite → `pg-core` (`pgTable`, `serial` PKs, `boolean`/`timestamp` columns); `src/db/index.ts` → `drizzle-orm/postgres-js` client (throws if `DATABASE_URL` unset); `src/db/migrate.ts` → `drizzle-orm/postgres-js/migrator`; `drizzle.config.ts` → `postgresql` dialect + `dbCredentials.url`
- [x] Deleted old SQLite migrations (0000 + 0001 + meta) and regenerated fresh single Postgres migration `0000_first_richard_fisk.sql` (all 7 tables, `serial` PKs, native boolean/timestamp, FKs `ON DELETE no action` — same semantics as before, no cascade); journal + snapshot kept
- [x] Created `.env.example` (committed via `!.env.example` gitignore exception): DATABASE_URL with Supabase pooler/direct connection notes + all AI provider/moderator/voice/image/Veriff vars
- [x] Updated `.kilocode/recipes/add-database.md` to Supabase Postgres wiring (pgTable/serial/postgres-js/DATABASE_URL, generate + migrate) with a deprecation note for `@kilocode/app-builder-db`
- [x] Solved pg-core dialect break: `integer({ mode: "boolean" })`/`integer({ mode: "timestamp" })` are NOT valid in pg-core → replaced with native `boolean()`/`timestamp()` columns (app-level values unchanged: booleans and JS Dates via `$defaultFn`); no route/component changes required — typecheck + lint fully green

## Session History

- 2026-09-06: Built core persona engine (types, taxonomy, options, definition composer, presets, prompt builder).
- 2026-09-06: Built frontend wave (ChatApp rewrite, KinkPicker, PersonaEditor, ProfileDrawer, AgeGate/layout/globals branding). Typecheck + lint green.
- 2026-09-06: Backend wave 2 — persona/user-profile persistence, greeting seeding, legality-only moderation, adult-first provider chain (migration generated, not applied).
- 2026-09-06: Committed + pushed erotica wave (`87c51a9`); switched data layer to Supabase Postgres (`postgres-js` + pg dialect, fresh `0000_first_richard_fisk` migration) and added `.env.example`. Typecheck + lint green.