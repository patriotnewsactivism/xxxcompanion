# Active Context: Companion

## Current State

**Status**: ✅ MVP scaffold implemented — typechecks and lints clean.

The template has been expanded into an adult AI companion platform with age gating, safety moderation, persona-based chat, memory, and tiering.

## Recently Completed

- [x] Database layer (Drizzle + `@kilocode/app-builder-db`) with 6 tables + generated migration
- [x] Safety layer: moderation classifier (local rules + external stub), security logging, age gate, identity-verification stub
- [x] Persona engine: 5 presets, system-prompt builder, custom persona resolution
- [x] Memory: short-term sliding window + long-term RAG stub (keyword overlap + embeddings stub)
- [x] AI provider with OpenAI-compatible fetch + deterministic fallback
- [x] Voice/image/video integration stubs (premium-gated)
- [x] Tiering: `TIER_FEATURES` + daily rate limit (free = 20 msgs/day)
- [x] API routes: verify-age, chat, personas, account
- [x] UI: age gate + chat with persona picker
- [x] `bun typecheck` and `bun lint` pass

## Current Structure

| Area | Files | Status |
|------|-------|--------|
| DB | `src/db/*`, `drizzle.config.ts` | ✅ |
| Safety | `src/lib/safety/*` | ✅ |
| Persona | `src/lib/persona/*` | ✅ |
| Memory | `src/lib/memory/*` | ✅ |
| AI | `src/lib/ai/*` | ✅ |
| API | `src/app/api/*/route.ts` | ✅ |
| UI | `src/components/*`, `page.tsx`, `chat/page.tsx` | ✅ |

## Current Focus / Pending

- Voice/image/video integrations are stubs — wire to real providers (ElevenLabs, Deepgram, Stability, avatar synth)
- Replace self-reported age gate with real third-party identity verification
- External classifier + embedding endpoints need to be configured via env vars
- No streaming responses yet (non-streaming JSON)
- Multi-character mode declared in model but returns single-turn response

## Session History

| Date | Changes |
|------|---------|
| 2026-08-21 | Built full MVP scaffold from system spec: safety, personas, memory, tiering, AI provider, API routes, UI |