# Technical Context: Companion

## Technology Stack

| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| Next.js | 16.x | Framework (App Router) |
| React | 19.x | UI |
| TypeScript | 5.9.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Bun | Latest | Package manager & runtime |
| Drizzle ORM | 0.45.x | ORM |
| drizzle-kit | 0.31.x | Migrations |
| postgres-js | 3.4.x | Postgres driver (Supabase) |
| Supabase | Hosted | Production Postgres database |

## Environment Variables

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Supabase Postgres connection string (required for runtime DB queries; may be absent during build) |
| `ADULT_CHAT_ENDPOINT`, `ADULT_CHAT_API_KEY`, `ADULT_CHAT_MODEL` | Adult-first chat provider slot (OpenAI-compatible) |
| `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `COHERE_API_KEY`, `MISTRAL_API_KEY` | Fallback chat providers (priority order) |
| `MODERATION_API_URL`, `MODERATION_API_KEY` | External safety classifier |
| `EMBEDDING_API_URL`, `EMBEDDING_API_KEY` | Embeddings for RAG |
| `ELEVENLABS_API_KEY`, `DEEPGRAM_API_KEY` | Voice TTS/STT |
| `STABILITY_API_KEY` | Image generation |
| `AVATAR_SYNTHESIS_API_KEY` | Video synthesis |
| `VERIFF_API_KEY`, `VERIFF_SECRET_KEY`, `VERIFF_CALLBACK_URL` | Age verification (Veriff) |

See committed `.env.example` for the full annotated template with Supabase
pooler (port 6543, serverless) vs direct (port 5432, migrations) connection notes.

## Commands

```bash
bun install        # Install dependencies
bun typecheck      # tsc --noEmit
bun lint           # ESLint
bun db:generate    # Generate migration SQL (no live DB needed)
bun db:migrate     # Apply migrations — requires DATABASE_URL (direct connection recommended)
```

## Database Schema

`users`, `personas`, `user_profiles`, `conversations`, `messages`, `memories`,
`security_events`.

Timestamps use Postgres `timestamp` columns (Drizzle `mode: "date"`) with
`$defaultFn` (app-level default, no SQL DEFAULT). Booleans use Postgres
`boolean` columns. JSON stored as text columns (personaIds, shortTerm,
embedding, voiceConfig). Primary keys are `serial`.

## Key Dependencies

- `drizzle-orm`, `drizzle-kit`, `postgres` (postgres-js)
- DB accessed via a build-safe lazy `drizzle-orm/postgres-js` client; only
  usable server-side (a placeholder URL permits build-time module inspection,
  while a real query still requires `DATABASE_URL`)

## Constraints

- `DATABASE_URL` must be set for runtime queries; it may be absent while
  Next.js performs build-time module inspection
- Migrations are applied via `bun run db:migrate` (env set) or by pasting the
  generated SQL into the Supabase SQL Editor; no sandbox auto-migration
- Use the TRANSACTION pooler URI in serverless/Vercel; the direct URI for
  local drizzle-kit / long-lived migration runs
- postgres-js uses SSL and `prepare: false`; Supabase transaction mode on port
  6543 does not support prepared statements
- RLS is enabled on all public application tables without Data API policies;
  application access is through the server-only Postgres connection
- Next.js Google fonts (`Geist`) kept from template
