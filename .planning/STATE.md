---
gsd_state_version: 1.0
milestone: v9
milestone_name: Home V2 Final Issue Cleanup
status: complete
last_updated: "2026-07-07T19:40:00+02:00"
last_activity: 2026-07-07
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 6
  completed_plans: 6
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-07)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language runtime product copy, premium visual design, localized legal draft pages, and a clean Go/No-Go path for Home V2 switch-over planning.
**Current focus:** v9 is complete. `/home-v2` is ready for switch-over planning, but current `/` remains unchanged. Public route replacement still requires a separate switch-over stage, final image decision, legal review, and production SEO/rollback execution.

## Current Position

Phase: 303 Final Readiness Decision
Plan: 303-PLAN.md
Status: Complete
Last activity: 2026-07-07 - v9 completed

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 6 of 6
- Average duration: same-day execution
- Total execution time: 2026-07-07

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 298 | 1/1 | Complete | same day |
| 299 | 1/1 | Complete | same day |
| 300 | 1/1 | Complete | same day |
| 301 | 1/1 | Complete | same day |
| 302 | 1/1 | Complete | same day |
| 303 | 1/1 | Complete | same day |

**Recent Trend:**

- Last 6 completed phases: 298, 299, 300, 301, 302, 303
- Trend: v9 cleared v8 blockers enough to move `/home-v2` into switch-over planning.

*Updated after each plan completion*

## Accumulated Context

### Decisions

- Current `/` was preserved and was not replaced.
- `/home-v2` remains the preview route and future switch-over candidate.
- v9 final decision is Ready for switch-over planning, not public launch.
- Hero, Parent Confidence, and Trust/detail images are temporary-public-approved for preview and planning only.
- Legal pages now read as complete public-facing drafts, while unresolved legal facts remain internal review items.
- Future switch-over must decide canonical URL, sitemap, old-home preservation route, monitoring, and rollback commit path.
- Raw screenshots and audit JSON stayed under `/private/tmp/stoa-home-v2-v9/`.

### Hard No-Go Conditions Remaining For Public Launch

- No direct `/home-v2` to `/` route switch has been approved.
- Final Hero and Parent Confidence imagery still needs licensed/commissioned replacement or explicit owner approval for temporary use in a controlled launch.
- Legal pages still need qualified review before public reliance.
- Production canonical/sitemap/language alternate/monitoring/rollback details remain a dedicated switch-over task.

### Quick Tasks Completed

| Date | Task | Outcome |
|------|------|---------|
| 2026-07-08 | Home V2 watermark visibility tuning | Increased the subtle watermark texture contrast while preserving a non-grid premium material feel, then verified lint, build, preview screenshots, and desktop overflow. |
| 2026-07-07 | Home V2 subtle watermark texture | Replaced the fine grid overlay with a low-opacity paper/fabric watermark texture, verified lint/build and desktop/mobile preview screenshots. |
| 2026-07-07 | Home V2 color palette redesign | Replaced generic beige with a cooler porcelain/mist-grey Home V2 palette, scoped footer styling to Home V2, verified lint/build and desktop/mobile preview screenshots. |
| 2026-07-07 | v9 final issue cleanup | Fixed Home V2 responsive blockers, cleaned legal page presentation, added metadata, documented temporary image approval and switch-over plan, verified with screenshots/audits/lint/build/E2E. |
| 2026-07-07 | v8 visual QA execution | Captured screenshot matrix, reviewed visual quality, legal drafts, SEO/routing/rollback readiness, and produced No-Go switch decision plus v9 backlog. |
| 2026-07-07 | v7 multilingual execution | Added FR/IT runtime registration, Home V2 language controls, localized legal pages, QA docs, legal source notes, E2E coverage, and verification. |

### Pending Todos

- Plan a separate switch-over stage if `/home-v2` should replace `/`.
- Resolve final public imagery and legal review before broad public reliance.
- Keep raw v9 screenshots only as local QA evidence under `/private/tmp/stoa-home-v2-v9/`.

### Blockers/Concerns

- Public launch remains blocked by legal review and final asset decision.
- Runtime Romansh is not implemented and remains intentionally deferred.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| switch_over | replacing `/` with `/home-v2` | deferred to separate explicit stage |
| legal | qualified counsel review | required before final public reliance |
| imagery | final licensed/commissioned Hero and Parent imagery | recommended before broad public marketing |
| seo | production canonical/sitemap/language alternate policy | switch-over stage |
| screenshots | committing QA screenshots | not allowed |
| romansh | Runtime Romansh support | acknowledged and deferred |

## Operator Next Steps

- Start a dedicated switch-over planning milestone only if the owner approves replacing `/` later.
