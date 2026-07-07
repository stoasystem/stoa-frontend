# v7 Full-Site Multilingual Adaptation Plan

**Date:** 2026-07-07
**Status:** Planning handoff
**Applies to:** full STOA frontend

## Decision Summary

v7 is the full-site multilingual adaptation program for STOA. It is not a Home V2 switch-over, not a broad visual redesign, and not a new product-feature milestone.

Launch runtime languages:

- English (`en`)
- German (`de`)
- French (`fr`)
- Italian (`it`)

Swiss language policy:

- Switzerland has four national languages: German, French, Italian, and Romansh.
- Romansh must be acknowledged in the language policy so the omission is deliberate, not accidental.
- Runtime Romansh is deferred until there is a clear Graubunden/Romansh audience need, legal requirement, or translation budget.
- UI language controls should not show disabled Romansh options in the product because that creates unnecessary complexity and a promise the product cannot yet keep.

Public route policy:

- Current `/` remains unchanged.
- `/home-v2` remains a preview route.
- No replacement of `/` happens in v7 without a separate explicit switch-over milestone.

## Product Language Thesis

STOA should sound like a confident education product, not a model demo. Public copy should keep the Apple-like posture agreed in v6: clear, restrained, and product-confident without overexplaining technology.

Use:

- Learning Assistant
- learning support
- teacher-backed support
- practice
- learning activity
- progress visibility
- clear next step

Avoid in public-facing copy:

- AI tutor
- AI homework solver
- instant answer
- guaranteed improvement
- surveillance
- monitoring your child
- model, prompt, provider, demo, mock, sample

Internal implementation can still use technical terms where they belong, but user-facing strings should not expose them.

## Language Controls

### Home V2 Desktop

Use a premium inline segmented micro-control:

`EN  DE  FR  IT`

Rules:

- Lower visual weight than `Login`.
- No flags.
- No dropdown.
- Use precise spacing, subtle active state, and restrained border/light treatment.
- Should feel integrated with the high-end nav, not like a settings widget.

### Home V2 Mobile

Place language chips inside the expanded mobile menu:

`EN` `DE` `FR` `IT`

Rules:

- Do not crowd the closed nav.
- Chips should be tappable and readable.
- Active state should be clear but quiet.
- Keep `Login` easy to find.

### General App Pages

Upgrade the existing shared `LanguageSwitcher` for EN/DE/FR/IT. Keep app-page treatment functional and consistent; do not redesign every app page around the control.

## Runtime Scope

v7 should enable FR/IT in runtime, not only keep JSON resources on disk.

Likely implementation areas:

- `src/i18n/languages.ts`
- `src/i18n/index.ts`
- locale resource imports and registration
- Home V2 language control
- shared `LanguageSwitcher`
- persisted language preference
- any tests that currently assume EN/DE only

## Quality Tiers

### P0: Launch Quality

These routes need four-language screenshot review and human-quality copy:

- `/`
- `/home-v2`
- login/register/auth flows
- pricing
- contact/support
- privacy/terms entry points
- core student dashboard/chat/practice/classroom/library routes

### P1: Usable Quality

These routes need role-appropriate copy and smoke verification:

- parent dashboards/reports/children
- teacher/tutor dashboard, queue, classroom, profile, requests
- billing/referrals/support ticket surfaces
- organization and core admin dashboards

### P2: Coverage Quality

These routes need static checks, internal-term cleanup, and no broken locale rendering:

- deep admin analytics
- retention and moderation pages
- curriculum/report operations
- edge states, 401/403/404, empty/loading/error states

## v7 Milestone Split

| Milestone | Scope | Primary Output |
|-----------|-------|----------------|
| v7.1 | Scope, glossary, tone rules, language policy | locked language contract |
| v7.2 | Runtime enablement and language controls | EN/DE/FR/IT runtime switchable app |
| v7.3 | Public/auth/Home copy QA | launch-quality public and auth copy |
| v7.4 | Core product role copy QA | student/parent/tutor role copy |
| v7.5 | Admin/ops/billing/edge coverage | operational copy and route coverage |
| v7.6 | Legal/compliance research | privacy/terms candidate drafts for lawyer review |
| v7.7 | Cross-locale visual QA and release handoff | screenshot matrix, issue list, release handoff |

## Non-Goals

- Do not replace `/`.
- Do not add product features.
- Do not create runtime Romansh yet.
- Do not claim final legal compliance.
- Do not reopen the v6 visual direction unless a language fit issue requires a small responsive/layout fix.

## Source Notes

- Swiss language reference: https://www.aboutswitzerland.eda.admin.ch/en/language
- Swiss federal law source root for legal validation: https://www.fedlex.admin.ch/
