# System Patterns: Companion

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx            # Root layout + metadata
│   ├── page.tsx              # Age gate (server redirect logic)
│   ├── chat/page.tsx         # Chat shell (server redirect -> ChatApp)
│   └── api/
│       ├── verify-age/route.ts   # POST: DOB + consent -> cookies
│       ├── chat/route.ts         # POST: full generation pipeline
│       ├── personas/route.ts     # GET list / POST create (premium)
│       └── account/route.ts      # GET current user
├── components/
│   ├── AgeGate.tsx           # Client age-gate form
│   └── ChatApp.tsx           # Client chat + persona picker
├── db/
│   ├── schema.ts             # Drizzle tables
│   ├── index.ts              # createDatabase
│   ├── migrate.ts
│   └── migrations/
└── lib/
    ├── types.ts              # Domain types
    ├── tiers.ts              # Feature flags + rate limits
    ├── session.ts            # Cookie-based session + user resolution
    ├── safety/
    │   ├── moderation.ts     # Local regex + external classifier
    │   ├── securityLog.ts    # Persist security events
    │   ├── ageGate.ts        # MINIMUM_AGE + computeAge
    │   └── identityVerification.ts  # Third-party stub
    ├── persona/
    │   ├── presets.ts        # Built-in personas
    │   └── prompt.ts         # System prompt builder
    ├── memory/
    │   ├── shortTerm.ts      # Sliding window
    │   └── longTerm.ts       # RAG stub (keyword overlap + embedText)
    └── ai/
        ├── provider.ts       # Chat completions + deterministic fallback
        ├── voice.ts          # TTS/STT stubs (premium)
        ├── image.ts          # Character still stub (premium)
        └── video.ts          # Avatar video stub (premium)
```

## Key Design Patterns

### 1. Request Pipeline (chat route)

Order matters and each stage gates the next:
1. Resolve session user (cookie → DB)
2. Enforce: authenticated → not terminated → age verified
3. Enforce tier feature (`multiCharacter`, `customPersona`, premium persona)
4. Enforce daily rate limit (free tier sliding window)
5. Moderate input (terminate → ban + delete cookie; block → 403)
6. Resolve/create conversation + load short-term window
7. Retrieve long-term memories (premium only)
8. Build system prompt → generate → moderate output
9. Persist messages + short-term + usage, return reply

### 2. Server/Client Boundary

- Server Components: gate pages via `cookies()` (`isAgeVerified`)
- Client Components: `AgeGate`, `ChatApp` (fetch-only, no DB)
- DB access only in route handlers / server libs

### 3. Safety Classifier Chain

Local regex rules (always-on, fail-closed for minors/sexual violence) + optional external classifier via `MODERATION_API_URL`/`MODERATION_API_KEY`.

### 4. Persona Model

Presets are static code; custom personas are DB rows owned by a user. Resolved to a unified `Persona` shape, then rendered into a system prompt with memory + short-term context.

### 5. Tiering

`TIER_FEATURES` map + `hasFeature(tier, feature)`. Free tier text-only, 20 msgs/day; everything else premium-gated and stubbed.