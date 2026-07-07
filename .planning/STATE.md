---
gsd_state_version: 1.0
milestone: v8
milestone_name: Home V2 Visual QA And Switch Decision
status: complete
last_updated: "2026-07-07T14:55:00+02:00"
last_activity: 2026-07-07 - v8 visual QA completed with switch-over No-Go decision
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

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language runtime product copy, premium visual design, localized legal draft pages, and a clean Go/No-Go path for Home V2 switch-over planning.
**Current focus:** v8 is complete. `/home-v2` is confirmed as the stronger visual direction, but switch-over is No-Go until v9 remediation fixes final image approval, FR mobile overflow, mobile Hero rhythm, legal-page presentation, SEO/routing, and rollback readiness. Current `/` remains unchanged.

## Current Position

Phase: None
Plan: None
Status: v8 complete
Last activity: 2026-07-07 - completed v8 screenshot-backed visual QA and switch decision

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 7 of 7
- Average duration: same-day execution
- Total execution time: 2026-07-07

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 291 | 1/1 | Complete | same day |
| 292 | 1/1 | Complete | same day |
| 293 | 1/1 | Complete | same day |
| 294 | 1/1 | Complete | same day |
| 295 | 1/1 | Complete | same day |
| 296 | 1/1 | Complete | same day |
| 297 | 1/1 | Complete | same day |

**Recent Trend:**

- Last 7 completed phases: 291, 292, 293, 294, 295, 296, 297
- Trend: v8 completed screenshot-backed Home V2 QA and produced a No-Go switch decision with a v9 remediation backlog.

*Updated after each plan completion*

## Accumulated Context

### Decisions

- `/home-v2` is the primary QA object.
- Current `/` is comparison-only and must not be replaced in v8.
- v8 does not modify frontend code, replace images, rewrite major copy, or submit screenshots.
- Raw screenshots are stored under `/private/tmp/stoa-home-v2-v8/`.
- QA must include real browser screenshots and human design review.
- Visual review prioritizes design quality first, content quality second, launch risk third.
- Final-public image readiness is a hard Go/No-Go gate.
- Legal pages should be complete, readable drafts for internal testing and lawyer review; page copy should not repeatedly declare unfinished/legal-ready status.
- Legal review pending blocks final public launch, but does not block visual QA assessment itself.
- v8 may conclude visual Go but switch-over No-Go.
- All fix work discovered in v8 is deferred to v9.

### Hard No-Go Conditions

- Hero or Parent Confidence main image is not acceptable for final-public use.
- EN/DE/FR/IT desktop or mobile layout has major overflow, overlap, broken wrapping, or poor crop.
- Mobile first impression is clearly not premium.
- Navigation, Login, or language controls are unclear or hard to use.
- Motion is visually disruptive, unreadable, blank, or too strong.
- `/privacy` or `/terms` is not a complete draft suitable for internal testing and lawyer review.
- SEO, routing, or rollback readiness is unclear enough to make switch-over unsafe.
- Current `/` is still a stronger public entry than `/home-v2`.

### Quick Tasks Completed

| Date | Task | Outcome |
|------|------|---------|
| 2026-07-07 | v8 grill-me preparation | Confirmed QA-only boundary, screenshot evidence rules, legal draft expectations, switch readiness appendix, and v9 remediation policy. |
| 2026-07-07 | v8 visual QA execution | Captured screenshot matrix, reviewed visual quality, legal drafts, SEO/routing/rollback readiness, and produced No-Go switch decision plus v9 backlog. |
| 2026-07-07 | v7 multilingual execution | Added FR/IT runtime registration, Home V2 language controls, localized legal pages, QA docs, legal source notes, E2E coverage, and verification. |
| 2026-07-06 | Home V2 v6 completion handoff | Created completion report, runtime snapshot, readiness register, switch-over gate, and v7 next-program brief. |

### Pending Todos

- Run v9 final issue cleanup from `docs/home-v2/v8-go-no-go-register.md`.
- Keep raw screenshots in `/private/tmp/stoa-home-v2-v8/` while this local QA evidence is needed.
- Do not replace `/` until v9 is complete and a separate switch-over stage is explicitly approved.

### Blockers/Concerns

- Final-public Hero and Parent Confidence photography remain preview-approved rather than final-public approved.
- FR mobile has horizontal overflow and blocks switch-over.
- Legal page presentation is complete-draft usable but visibly lawyer-review/draft framed.
- SEO, route metadata, canonical/sitemap, and Home V2-specific rollback plan are incomplete.
- Legal entity, address, processor list, retention schedule, payment provider, age/guardian policy, refund terms, governing law, and legal review remain unresolved.
- Runtime Romansh is not implemented and remains intentionally deferred.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| remediation | v9 final issue cleanup | next recommended milestone |
| legal | qualified counsel review | required before final public reliance |
| switch_over | replacing `/` with `/home-v2` | deferred to separate explicit stage |
| screenshots | committing QA screenshots | not allowed in v8 |
| romansh | Runtime Romansh support | acknowledged and deferred |

## Operator Next Steps

- Start v9 final issue cleanup from `docs/home-v2/v8-go-no-go-register.md`.
