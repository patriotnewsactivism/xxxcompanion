# Project Brief: Companion — AI Adult Companion Platform

## Purpose

An adult-oriented AI companion platform for verified adults (18+ / 21+ by jurisdiction). Users chat with adaptive AI personas (romantic partner, BDSM dynamics, flirtatious companion, immersive roleplay) with short- and long-term memory, voice/visual generation, and free/premium tiering.

## Target Users

- Verified adults (18+) seeking AI companionship and adult roleplay
- Consent-focused users who expect clear safety guardrails

## Core Use Cases

1. Age-gated access via self-reported DOB (with third-party identity verification as the production path)
2. Persona-driven conversational roleplay in single- or multi-character modes
3. Persistent memory: short-term session context + long-term user-keyed memory (premium)
4. Tiered monetization: free text-only vs premium voice/image/video/multi-character/custom personas

## Key Requirements

### Must Have

- Third-party age verification gating (stubbed identity verification provider)
- Zero-tolerance safety pipeline: input/output moderation classifiers + security logging
- Persona engine with presets + custom personas
- Memory: short-term window + long-term RAG stub
- Free vs premium tiering with feature flags and daily rate limit
- Multi-character speaker tokens

### Nice to Have

- Voice (TTS/STT), image, and video generation (integration stubs, premium-gated)

## Success Metrics

- Clean typecheck and lint
- Working chat pipeline with safety enforcement
- Migrations runnable in sandbox

## Constraints

- Framework: Next.js 16 + React 19 + Tailwind CSS 4
- Package manager: Bun
- DB: Drizzle + SQLite via `@kilocode/app-builder-db` (HTTP API)
- Adult content only, strict 18+ gating, no minors, no non-consensual content