# Context Memory Bank

## Current State

Frontend wave landed: full chat UI rewrite with persona creation (PersonaEditor), profile drawer (ProfileDrawer), kink picker (KinkPicker), greeting bubbles, termination/blocked handling, and rebranding (AgeGate copy, layout metadata, rose accent globals). Backend wave 2 landed alongside: full persona persistence + `user_profiles` table + `/api/profile`, greeting seeding into new conversations, legality-only moderation, adult-first provider chain (env-gated ADULT_CHAT_* + OpenRouter Venice Uncensored). Migration `0001_volatile_valkyrie` generated but NOT applied (sandbox lacks DB_URL/DB_TOKEN). `bun typecheck` and `bun lint` are fully green.

## Recently Completed

- [x] Extended `src/lib/types.ts`: `KinkCategory`, `Kink`, `SceneSetting`, `ScenePreset`, `ExplicitnessLevel`, `NarrativeStyle`, `ResponseLength`, new required `Persona` fields (kinks/hardLimits/softLimits/explicitness/narrativeStyle/responseLength + optional appearance/pronouns/scene/greeting), new `UserProfile`, `ChatResponse.greeting?`
- [x] Created `src/lib/kinks/taxonomy.ts`: 81 kinks across 11 categories, 12 scene presets, 5 helpers (`findKink`, `kinksByCategory`, `normalizeTags`, `kinkLabel`, `formatKinkList`)
- [x] Created `src/lib/persona/options.ts`: `EXPLICITNESS_LABELS`, `PERSONA_GENRES`, `RELATIONSHIP_DYNAMICS`, `NARRATIVE_STYLE_LABELS`, `RESPONSE_LENGTH_LABELS`, `DEFAULT_PERSONA_FIELDS`
- [x] Created `src/lib/persona/definition.ts`: `composeDefinition` (raw definition wins verbatim, else auto-composed paragraph)
- [x] Rewrote `src/lib/persona/presets.ts`: 5 original presets upgraded + 4 new (Nyx, Cassius, Isla, Orion); Orion and Roan are premiumOnly
- [x] Rewrote `src/lib/persona/prompt.ts`: `buildSystemPrompt` 11-section erotic prompt (no safety preamble; boundaries last), optional `profile`/`sceneOverride` options, exported `resolveScene`
- [x] Rewrote `src/components/ChatApp.tsx`: sidebar with kink chips + tier footer, header badge row (heat/scene/premium), greeting bubble without API call, New chat reset, terminated/blocked handling, PersonaEditor + ProfileDrawer wiring
- [x] Created `src/components/KinkPicker.tsx`: controlled searchable kink chips grouped by category + normalized freeform tag row, max cap (60)
- [x] Created `src/components/PersonaEditor.tsx`: premium-gated modal form (genres, dynamics, auto-generated definition with manualOverride freeze, kinks, limits, scene presets, heat slider, narrative/length segmented, greeting), POST /api/personas
- [x] Created `src/components/ProfileDrawer.tsx`: right slide-over, GET/PUT /api/profile, "Saved" fade state
- [x] Modified `src/components/AgeGate.tsx` (copy only), `src/app/layout.tsx` (metadata), `src/app/globals.css` (rose accent, selection, slim scrollbars)
- [x] Extended `src/db/schema.ts`: personas gains appearance/pronouns/kinks/hard_limits/soft_limits/scene/explicitness/narrative_style/response_length/greeting columns; new `user_profiles` table (userId PK → users.id, display_name, pronouns, gender, turn_ons/hard_limits/soft_limits arrays, safe_word, aftercare, notes, updated_at)
- [x] Generated drizzle migration `0001_volatile_valkyrie` (CREATE TABLE user_profiles + ALTER TABLE personas ADD COLUMN x10); NOT applied — sandbox lacks DB_URL/DB_TOKEN
- [x] Created `src/lib/persona/mapping.ts`: `rowToPersona` (JSON-array fallback "[]", nullable scene parse, defaults for explicitness/narrativeStyle/responseLength, safe voiceConfig parse)
- [x] Updated `src/app/api/personas/route.ts`: GET maps via `rowToPersona`; POST accepts all new fields (arrays normalized via `normalizeTags`, ≤100 items; strings trimmed, ≤500 chars; explicitness clamped 1..5; unions validated; scene validated + stringified)
- [x] Created `src/app/api/profile/route.ts`: GET/PUT upsert user profile, any signed-in tier (401 without session; arrays normalized, strings trimmed/capped)
- [x] Updated `src/app/api/chat/route.ts`: custom rows via `rowToPersona`; profile loaded and passed to `buildSystemPrompt`; new single-mode conversations seed `persona.greeting` as first assistant message (flows into shortTerm + returned as `ChatResponse.greeting` via `seededGreeting`); temperature 0.9/0.95/1.05 and maxTokens 500/900/1400 from persona; output-blocked fallback rewritten scene-gracefully
- [x] Rewrote `src/lib/safety/moderation.ts`: legality-only policy — minors, genuine non-consent (incl. drugged/incapacitated targeting), non-consensual deepfakes, self-harm are the only blocked categories; explicit consensual adult content never blocked by local rules; "forced orgasm"-style kink vocabulary verified unaffected
- [x] Updated `src/lib/ai/provider.ts`: env-gated adult-first slot (ADULT_CHAT_ENDPOINT/ADULT_CHAT_API_KEY/ADULT_CHAT_MODEL, model default dolphin-mistral-24b), OpenRouter adult model `cognitivecomputations/dolphin-mistral-24b-venice-edition` at position 1, then openrouter-free → cerebras → groq → cohere → mistral; maxTokens default 512→1024; fallback reply warmed to product voice

## Session History

- 2026-09-06: Built core persona engine (types, taxonomy, options, definition composer, presets, prompt builder).
- 2026-09-06: Built frontend wave (ChatApp rewrite, KinkPicker, PersonaEditor, ProfileDrawer, AgeGate/layout/globals branding). Typecheck + lint green.
- 2026-09-06: Backend wave 2 — persona/user-profile persistence, greeting seeding, legality-only moderation, adult-first provider chain (migration generated, not applied).