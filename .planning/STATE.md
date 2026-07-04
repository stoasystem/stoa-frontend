---
gsd_state_version: 1.0
milestone: v4.0
milestone_name: 新版路由与组件骨架
status: planning
last_updated: "2026-07-04T11:25:13.209Z"
last_activity: 2026-07-04
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 4
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-04)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.
**Current focus:** Milestone v4.0 新版路由与组件骨架 is in planning. The milestone will create an isolated, previewable `/home-v2` route and Home V2 component skeleton while keeping the current `/` homepage unchanged.

## Current Position

Phase: 244 Home V2 Route And Public Inventory
Plan: 244-PLAN.md
Status: Roadmap ready; waiting for phase planning
Last activity: 2026-07-04 — Milestone v4.0 roadmap created

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 0 of 4
- Average duration: not started
- Total execution time: in planning

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 244 | 0/1 | Pending | — |
| 245 | 0/1 | Pending | — |
| 246 | 0/1 | Pending | — |
| 247 | 0/1 | Pending | — |

**Recent Trend:**

- Last 4 completed phases: 240, 241, 242, 243
- Trend: v4.0 starts the Home V2 implementation chain with isolated route, component skeleton, i18n skeleton, preview layout, and verification phases.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v2.6 starts the separate Home V2 redesign track. The current `/` homepage remains unchanged while Home V2 is planned as a Swiss-parent-first route with a learning-thread IA, natural `Start learning` CTA direction, role-specific app boundaries, and EN/DE/FR/IT guardrails.
- v2.7 completed the Home V2 visual direction contract. The design direction is Editorial Luxury plus Editorial Split, with double-bezel proof surfaces, role-based typography, paper/charcoal/burgundy/sage/gold/cool-neutral color behavior, `Start learning` CTA treatment, image art direction, calm transform/opacity motion, and responsive/accessibility/localization handoff rules.
- v2.8 completed the Home V2 image and asset strategy contract. It defines source hierarchy, Pexels/iStock/Magnific source notes, license/release/endorsement screens, section asset briefs, multilingual search taxonomy, scoring and rejection criteria, metadata ledger, future storage namespace, crop/optimization expectations, approval gates, and QA handoff.
- v3.1 allows downloading suitable free, license-clear, traceable candidates when source, license, creator/vendor, AI status, role, and risk metadata are recorded.
- v3.1 now keeps a refreshed Pexels/Unsplash candidate set. iStock remains paid and purchase-gated; Magnific remains stock/API/workflow-gated because it mixes licensed stock access and AI creative tooling.
- PEX-8121121 is the best free Hero candidate found. PEX-9240631 was removed from local candidates because the creator/vendor name creates education-brand adjacency.
- 2026-07-04 Swiss-market refresh: Asian-family mismatch candidates were removed from the active Home V2 pool because the homepage is aimed at Swiss parents. Swiss/European family context or face-light educational detail is now required for main homepage imagery.
- Free stock is now acceptable for prototype work, but still not strong enough for final high-end Swiss private-education Hero positioning. Paid iStock or commissioned Swiss/European education photography remains recommended before public switch-over.

### Quick Tasks Completed

| Date | Task | Outcome |
|------|------|---------|
| 2026-07-04 | Home V2 Swiss-market image refresh | Removed mismatch candidates, added Unsplash alternatives, and updated shortlist/ledger/state. |

### Pending Todos

- Future Home V2 implementation work: final asset selection, crop variants, image optimization, WebP/AVIF generation, localized alt text, React route/component implementation, animation choreography, screenshot QA, and `/` switch approval remain out of scope until separately planned.

### Blockers/Concerns

- Free Pexels/Unsplash candidates are suitable for prototype/preview but may not fully express Swiss private-school tone. A paid iStock or commissioned search may still be needed for the final public Hero.
- Identifiable people appear in the downloaded candidates. Public use must avoid implying endorsement, negative portrayal, surveillance, or guaranteed educational outcomes.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| paid_assets | iStock purchase and final license approval | deferred |
| asset_pipeline | crop/optimization/WebP variants | deferred |
| implementation | `/home-v2` React route and components | deferred |
| qa | browser screenshot QA with final assets | deferred |
