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
| @kilocode/app-builder-db | github | SQLite via HTTP API client |

## Environment Variables

| Variable | Purpose |
| -------- | ------- |
| `DB_URL`, `DB_TOKEN` | Sandbox DB (auto-provided) |
| `CHAT_API_KEY`, `CHAT_API_BASE_URL`, `CHAT_MODEL` | Chat model provider |
| `MODERATION_API_URL`, `MODERATION_API_KEY` | External safety classifier |
| `EMBEDDING_API_URL`, `EMBEDDING_API_KEY` | Embeddings for RAG |
| `ELEVENLABS_API_KEY`, `DEEPGRAM_API_KEY` | Voice TTS/STT |
| `STABILITY_API_KEY` | Image generation |
| `AVATAR_SYNTHESIS_API_KEY` | Video synthesis |
| `IDENTITY_VERIFICATION_PROVIDER` | Age verification provider |

## Commands

```bash
bun install        # Install dependencies
bun typecheck      # tsc --noEmit
bun lint           # ESLint
bun db:generate    # Generate migration SQL
bun db:migrate     # Apply migrations (never run manually in sandbox — auto after push)
```

## Database Schema

`users`, `personas`, `conversations`, `messages`, `memories`, `security_events`.

Timestamps stored as integer epoch (Drizzle `mode: "timestamp"`) with `$defaultFn` (app-level default, no SQL DEFAULT). JSON stored as text columns (personaIds, shortTerm, embedding, voiceConfig).

## Key Dependencies

- `drizzle-orm`, `drizzle-kit`, `@kilocode/app-builder-db`
- DB accessed via HTTP API (`drizzle-orm/sqlite-proxy`); only usable server-side

## Constraints

- `DB_URL`/`DB_TOKEN` must be set at runtime or `createDatabase` throws
- Migrations auto-run in sandbox after push; never `bun db:migrate` locally
- Next.js Google fonts (`Geist`) kept from template