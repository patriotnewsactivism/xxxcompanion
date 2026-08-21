# Product Context: Companion

## Why This Exists

An adult companion platform that pairs adaptive AI personas with a consent-first, safety-gated experience. It separates free text chat from premium multimodal features (voice, imagery, multi-character) while maintaining strict age verification and content moderation.

## User Flow

1. Landing → age gate (confirm 18+ + DOB)
2. `POST /api/verify-age` → sets `user_id` + `age_verified` cookies, persists user.
3. Redirected to `/chat` (server-gated on cookie).
4. Select persona from presets (+ custom personas if premium).
5. Send messages → `POST /api/chat` runs: auth/age check → tier/limit checks → input moderation → prompt assembly (persona + memories + short-term) → generation → output moderation → persist → reply.
6. Premium unlocks voice/image/video/custom personas/multi-character (gated in lib, stubbed integrations).

## Feature Tiers

### Free

- Text-only chat
- Short-term session memory (no cross-session persistence)
- Standard presets
- 20 messages/day

### Premium

- Long-term persistent memory (RAG)
- Voice streaming (TTS/STT)
- High-res image + avatar video generation
- Multi-character rooms
- Custom persona creation
- Unlimited messages

## Key UX Goals

- Age gate is non-bypassable at the route level (server checks, not just UI)
- Safety failures surface clearly (blocked vs terminated)
- Personas feel distinct via tone/dynamic/definition in system prompt