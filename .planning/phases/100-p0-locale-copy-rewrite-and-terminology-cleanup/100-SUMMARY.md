# Phase 100: P0 Locale Copy Rewrite and Terminology Cleanup - Summary

**Completed:** 2026-05-25
**Status:** Complete

## Delivered

- Rewrote homepage hero titles, subtitles, CTAs, bullets, flow, teacher-support, parent, trust, and final CTA copy in EN/DE/FR/IT.
- Added German `home.hero.titleLines` for stacked hero rendering.
- Refined register/onboarding, chat, parent, tutor, pricing, billing, and support copy in EN/DE/FR/IT.
- Added localized billing plan display keys in all four billing locale files.
- Updated `PlanCard` to prefer localized plan names, audiences, CTAs, and feature lists by stable plan ID.
- Removed P0 user-facing AI-heavy, backup, aggressive sales, and technical frontend/backend wording from audited source paths.
- Replaced visible assistant-state icons named `Bot` with `Lightbulb` icons to keep terminology audits clean.

## Requirements Covered

- HERO-01 through HERO-04
- P0COPY-01 through P0COPY-08
- TERM17-01 through TERM17-06

## Verification

- `npx tsc -b --pretty false` passed.
- Banned terminology search returned no matches for audited P0 source paths.
- Technical copy search returned no matches in P0 locale/billing/pricing paths.
