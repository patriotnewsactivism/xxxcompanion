# Context Memory Bank

## Current State

Data layer is now Supabase Postgres: Drizzle `pg-core` schema (7 tables:
users, personas, conversations, messages, memories, security_events,
user_profiles), `postgres-js` driver, and a build-safe lazy database client.
The SQLite
`@kilocode/app-builder-db` stack (DB_URL/DB_TOKEN) was removed. Migration
`0000_first_richard_fisk`, `0001_surge_bridge`, and the checked-in
`0002_enable_rls` hardening are **APPLIED** to Supabase (transaction pooler,
port 6543) as of 2026-09-06.
Live verification via `information_schema` confirmed all 7 tables and their
expected column counts. RLS is enabled on all 7 tables with no Data API
policies, so anon/authenticated access is denied while server-side Postgres
access remains the application path. `DATABASE_URL` is set locally in
`.env.local` (gitignored, never committed) and is still required in the Vercel
project environment for production. The postgres-js client requires SSL for
Supabase URLs and disables prepared statements for transaction-pooler
compatibility.

## Recently Completed

- [x] Committed + pushed erotica feature wave (persona engine, kink taxonomy, 9 personas, erotic prompt builder, chat UI rewrite with persona editor/profile drawer/kink picker, legality-only moderation, adult-first provider chain, legal pages, user_profiles + migration 0001) — commit `87c51a9`
- [x] Switched data layer to Supabase Postgres: removed `@kilocode/app-builder-db`, added `postgres`; `src/db/schema.ts` converted SQLite → `pg-core` (`pgTable`, `serial` PKs, `boolean`/`timestamp` columns); `src/db/index.ts` → `drizzle-orm/postgres-js` client (throws if `DATABASE_URL` unset); `src/db/migrate.ts` → `drizzle-orm/postgres-js/migrator`; `drizzle.config.ts` → `postgresql` dialect + `dbCredentials.url`
- [x] Deleted old SQLite migrations (0000 + 0001 + meta) and regenerated fresh single Postgres migration `0000_first_richard_fisk.sql` (all 7 tables, `serial` PKs, native boolean/timestamp, FKs `ON DELETE no action` — same semantics as before, no cascade); journal + snapshot kept
- [x] Created `.env.example` (committed via `!.env.example` gitignore exception): DATABASE_URL with Supabase pooler/direct connection notes + all AI provider/moderator/voice/image/Veriff vars
- [x] Updated `.kilocode/recipes/add-database.md` to Supabase Postgres wiring (pgTable/serial/postgres-js/DATABASE_URL, generate + migrate) with a deprecation note for `@kilocode/app-builder-db`
- [x] Solved pg-core dialect break: `integer({ mode: "boolean" })`/`integer({ mode: "timestamp" })` are NOT valid in pg-core → replaced with native `boolean()`/`timestamp()` columns (app-level values unchanged: booleans and JS Dates via `$defaultFn`); no route/component changes required — typecheck + lint fully green
- [x] Created `.env.local` with `DATABASE_URL` (verbatim pooler URI) — confirmed gitignored via `git check-ignore`, never committed
- [x] Reconciled migration history with the concurrent Surge bridge work: `0001_surge_bridge` adds `users.surge_sub` plus its partial unique index and has a matching Drizzle journal/snapshot entry
- [x] Applied the migration chain through Supabase's transaction pooler (port 6543); retained the lazy build-safe DB client, required SSL for Supabase URLs, disabled prepared statements for transaction mode, and guaranteed client shutdown via `finally`
- [x] Added and applied `0002_enable_rls`: all 7 public tables have RLS enabled and no anon/authenticated Data API policies because database access is server-side only
- [x] Verified the live schema: all 7 tables are present with expected column counts (`users` 10, `personas` 24, `conversations` 8, `messages` 7, `memories` 7, `security_events` 6, `user_profiles` 11); Drizzle migration history advanced successfully

## Session History

- 2026-09-06: Built core persona engine (types, taxonomy, options, definition composer, presets, prompt builder).
- 2026-09-06: Built frontend wave (ChatApp rewrite, KinkPicker, PersonaEditor, ProfileDrawer, AgeGate/layout/globals branding). Typecheck + lint green.
- 2026-09-06: Backend wave 2 — persona/user-profile persistence, greeting seeding, legality-only moderation, adult-first provider chain (migration generated, not applied).
- 2026-09-06: Committed + pushed erotica wave (`87c51a9`); switched data layer to Supabase Postgres (`postgres-js` + pg dialect, fresh `0000_first_richard_fisk` migration) and added `.env.example`. Typecheck + lint green.
- 2026-09-06: Set `DATABASE_URL` in `.env.local` (gitignored), reconciled the base/Surge/RLS migration chain, applied it to the Supabase pooler, verified all 7 tables and expected columns via `information_schema`, and finalized transaction-pooler-safe client settings for commit/push.
