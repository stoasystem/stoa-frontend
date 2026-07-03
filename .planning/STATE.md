---
gsd_state_version: 1.0
milestone: v3.1
milestone_name: Home V2 Candidate Image Search And Shortlist
status: complete
last_updated: "2026-07-03T22:20:00.000Z"
last_activity: 2026-07-03
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-03)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.
**Current focus:** Milestone v3.1 Home V2 Candidate Image Search And Shortlist is complete. Home V2 now has a downloaded, traceable, free Pexels candidate set plus metadata and high-end visual scoring for later implementation.

## Current Position

Phase: 243 Handoff QA And Next Asset Insertion Plan
Plan: 243-PLAN.md
Status: v3.1 complete; image shortlist is ready for final selection, crop/optimization, and `/home-v2` implementation in a later milestone
Last activity: 2026-07-03 — Completed v3.1 candidate image search, downloads, metadata ledger, shortlist, and handoff

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 4 of 4
- Average duration: same-day image search and documentation milestone
- Total execution time: completed 2026-07-03

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 240 | 1/1 | Complete | 2026-07-03 |
| 241 | 1/1 | Complete | 2026-07-03 |
| 242 | 1/1 | Complete | 2026-07-03 |
| 243 | 1/1 | Complete | 2026-07-03 |

**Recent Trend:**

- Last 4 completed phases: 240, 241, 242, 243
- Trend: v3.1 completed actual Home V2 candidate search and downloaded free, traceable Pexels assets while keeping paid/source-gated assets out of the repo.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v2.6 starts the separate Home V2 redesign track. The current `/` homepage remains unchanged while Home V2 is planned as a Swiss-parent-first route with a learning-thread IA, natural `Start learning` CTA direction, role-specific app boundaries, and EN/DE/FR/IT guardrails.
- v2.7 completed the Home V2 visual direction contract. The design direction is Editorial Luxury plus Editorial Split, with double-bezel proof surfaces, role-based typography, paper/charcoal/burgundy/sage/gold/cool-neutral color behavior, `Start learning` CTA treatment, image art direction, calm transform/opacity motion, and responsive/accessibility/localization handoff rules.
- v2.8 completed the Home V2 image and asset strategy contract. It defines source hierarchy, Pexels/iStock/Magnific source notes, license/release/endorsement screens, section asset briefs, multilingual search taxonomy, scoring and rejection criteria, metadata ledger, future storage namespace, crop/optimization expectations, approval gates, and QA handoff.
- v3.1 allows downloading suitable free, license-clear, traceable candidates when source, license, creator/vendor, AI status, role, and risk metadata are recorded.
- v3.1 downloads only Pexels candidates. iStock remains paid and purchase-gated; Magnific remains stock/API/workflow-gated because it mixes licensed stock access and AI creative tooling.
- PEX-8121121 is the best free Hero candidate found. PEX-9240631 is visually relevant but deferred because the creator/vendor name creates education-brand adjacency.

### Pending Todos

- Future Home V2 implementation work: final asset selection, crop variants, image optimization, WebP/AVIF generation, localized alt text, React route/component implementation, animation choreography, screenshot QA, and `/` switch approval remain out of scope until separately planned.

### Blockers/Concerns

- Free Pexels candidates are suitable for prototype/preview but may not fully express Swiss private-school tone. A paid iStock or commissioned search may still be needed for the final public Hero.
- Identifiable people appear in the downloaded candidates. Public use must avoid implying endorsement, negative portrayal, surveillance, or guaranteed educational outcomes.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| paid_assets | iStock purchase and final license approval | deferred |
| asset_pipeline | crop/optimization/WebP variants | deferred |
| implementation | `/home-v2` React route and components | deferred |
| qa | browser screenshot QA with final assets | deferred |
