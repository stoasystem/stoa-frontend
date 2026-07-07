---
gsd_state_version: 1.0
milestone: v7
milestone_name: Full-Site Multilingual Adaptation Execution
status: complete
last_updated: "2026-07-07T12:30:00+02:00"
last_activity: 2026-07-07 - v7 multilingual execution completed
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 7
  completed_plans: 7
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-07)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language runtime product copy, premium visual design, localized legal candidate pages, and a clean path to future legal review or Home V2 switch-over.
**Current focus:** v7 is complete. Runtime languages are EN/DE/FR/IT, Home V2 has premium desktop/mobile language controls, `/privacy` and `/terms` are localized lawyer-review candidate pages, current `/` remains unchanged, `/home-v2` remains preview, and Romansh remains acknowledged but deferred.

## Current Position

Phase: None
Plan: None
Status: v7 complete
Last activity: 2026-07-07 - completed runtime FR/IT enablement, Home V2 language controls, legal localization, copy QA docs, and verification

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 7 of 7
- Average duration: same-day execution
- Total execution time: 2026-07-07

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 284 | 1/1 | Complete | same day |
| 285 | 1/1 | Complete | same day |
| 286 | 1/1 | Complete | same day |
| 287 | 1/1 | Complete | same day |
| 288 | 1/1 | Complete | same day |
| 289 | 1/1 | Complete | same day |
| 290 | 1/1 | Complete | same day |

**Recent Trend:**

- Last 7 completed phases: 284, 285, 286, 287, 288, 289, 290
- Trend: v7 executed the multilingual runtime and QA track; future work should be legal review, full screenshot QA, or a separate Home V2 switch-over program.

*Updated after each plan completion*

## Accumulated Context

### Decisions

- Launch runtime languages are EN/DE/FR/IT.
- Romansh is acknowledged and intentionally deferred.
- Home V2 uses a premium inline desktop language control and mobile menu chips.
- Shared app language switcher inherits the four launch languages.
- `/privacy` and `/terms` are localized candidate legal pages and require legal review before public reliance.
- Current `/` remains unchanged.
- `/home-v2` remains preview.

### Quick Tasks Completed

| Date | Task | Outcome |
|------|------|---------|
| 2026-07-07 | v7 multilingual execution | Added FR/IT runtime registration, Home V2 language controls, localized legal pages, QA docs, legal source notes, E2E coverage, and verification. |
| 2026-07-07 | v7 multilingual planning | Created requirements, roadmap, language policy, glossary, tone rules, route QA matrix, legal research plan, and v7.1-v7.7 roadmap. |
| 2026-07-06 | Home V2 v6 completion handoff | Created completion report, runtime snapshot, readiness register, switch-over gate, and v7 next-program brief. |

### Pending Todos

- Run full route screenshot QA before broad public launch or Home V2 switch-over.
- Send legal candidate pages and docs for qualified legal review.
- Decide separately whether `/home-v2` should ever replace `/`.

### Blockers/Concerns

- Legal pages are candidate drafts only; legal entity, address, processor list, retention schedule, payment provider, age/guardian policy, refund terms, governing law, and legal review remain unresolved.
- Runtime Romansh is not implemented.
- Full screenshot QA across all P0/P1 routes remains recommended.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| legal | Lawyer approval of Privacy/Terms | deferred to external legal review |
| qa | Full P0/P1 screenshot matrix | recommended before broad launch |
| romansh | Runtime Romansh support | acknowledged and deferred |
| switch_over | replacing `/` with Home V2 | out of scope until explicit approval |

## Operator Next Steps

- Review the localized `/privacy` and `/terms` copy with counsel and run full EN/DE/FR/IT screenshot QA before any broad launch decision.
