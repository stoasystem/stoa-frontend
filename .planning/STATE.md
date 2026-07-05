---
gsd_state_version: 1.0
milestone: v4.0
milestone_name: 新版路由与组件骨架
status: Awaiting next milestone
last_updated: "2026-07-04T18:36:24.970Z"
last_activity: 2026-07-05 — Completed quick task 260705-lgd: Show registration password requirements when password is noncompliant
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-04)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.
**Current focus:** Milestone v4.0 新版路由与组件骨架 is complete. Home V2 now has an isolated `/home-v2` preview route, component namespace, provisional `homeV2` i18n skeleton, previewable layout, focused E2E smoke coverage, and handoff documentation while keeping the current `/` homepage unchanged.

## Current Position

Phase: Milestone v4.0 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-07-05 — Softened Home V2 Learning Thread animation to breathing light

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 4 of 4
- Average duration: same-day route/component skeleton execution
- Total execution time: completed 2026-07-04

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 244 | 1/1 | Complete | 2026-07-04 |
| 245 | 1/1 | Complete | 2026-07-04 |
| 246 | 1/1 | Complete | 2026-07-04 |
| 247 | 1/1 | Complete | 2026-07-04 |

**Recent Trend:**

- Last 4 completed phases: 244, 245, 246, 247
- Trend: v4.0 completed the isolated `/home-v2` route, section component namespace, provisional `homeV2` i18n skeleton, previewable visual layout, verification, and handoff.

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
- v4.0 completed the isolated `/home-v2` preview route and Home V2 namespace while preserving the current `/` homepage.
- v4.0 keeps final asset insertion, motion choreography, final copy/localization, screenshot QA, and switching `/` as separate future milestones.
- 2026-07-05 Home V2 visual feedback: the first skeleton still felt too close to the current homepage, so `/home-v2` was reworked toward an Editorial Luxury plus Z-Axis Cascade direction with scoped visual tokens, floating island navigation, layered image/proof surfaces, pill CTAs, and scroll reveal behavior.
- 2026-07-05 Home V2 Hero grilling: Hero direction was narrowed to short brand headline, one main family-learning image, one minimal proof panel, Start learning plus For parents CTAs, and a low-noise but easy-to-find Login entry in the floating nav.

### Quick Tasks Completed

| Date | Task | Outcome |
|------|------|---------|
| 2026-07-05 | Registration password requirements guidance | Added visible password rules, matched frontend validation to the policy, mapped backend password-policy errors to concrete guidance, and verified auth e2e plus lint. |
| 2026-07-05 | Home V2 Learning Thread breathing light | Removed scanning sweep, rail glint, and rotating halo effects; kept only a slow soft active spark and halo breath. |
| 2026-07-05 | Home V2 narrow Hero image fix | Capped the Hero image panel below desktop, switched narrow screens to a shorter editorial landscape ratio, and preserved the tall desktop Hero composition. |
| 2026-07-05 | Home V2 desktop nav visibility | Converted Parents/Teachers/Pricing into a clearer segmented pill cluster with 16px text, stronger ink contrast, larger hit areas, and refined hover/focus states. |
| 2026-07-05 | Home V2 Learning Thread motion polish | Strengthened the active-card spark breathing, added a rotating halo layer, card light sweep, lit-line glint, and reduced-motion handling. |
| 2026-07-05 | Home V2 mobile login button fix | Fixed the mobile menu Login pill by giving it scoped ink text color instead of inheriting the overlay paper color. |
| 2026-07-05 | Home V2 Learning Thread animation | Added scroll-driven active beat tracking, progressive lit thread rail, warm active/completed node states, restrained ambient glow, mobile single-column behavior, and reduced-motion handling. |
| 2026-07-05 | Home V2 Hero refinement | Simplified Hero to a short brand headline, single main image, one proof panel, parent secondary CTA, and nav Login pill after grill-me clarification. |
| 2026-07-05 | Home V2 premium visual redesign | Rebuilt `/home-v2` visual direction with floating nav, layered imagery, scroll reveal, pill CTA system, compressed preview assets, and family-facing copy while preserving `/`. |
| 2026-07-04 | Home V2 Swiss-market image refresh | Removed mismatch candidates, added Unsplash alternatives, and updated shortlist/ledger/state. |

### Pending Todos

- Future Home V2 implementation work: final asset selection, crop variants, image optimization, WebP/AVIF generation, localized alt text, animation choreography, screenshot QA, and `/` switch approval remain out of scope until separately planned.

### Blockers/Concerns

- Free Pexels/Unsplash candidates are suitable for prototype/preview but may not fully express Swiss private-school tone. A paid iStock or commissioned search may still be needed for the final public Hero.
- Identifiable people appear in the downloaded candidates. Public use must avoid implying endorsement, negative portrayal, surveillance, or guaranteed educational outcomes.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| paid_assets | iStock purchase and final license approval | deferred |
| asset_pipeline | crop/optimization/WebP variants | deferred |
| implementation | final Home V2 asset insertion into the preview route | deferred |
| motion | Learning Thread animation implemented; remaining section-level choreography deferred | partial |
| copy | final EN/DE/FR/IT homepage copywriting | deferred |
| switch_over | replacing `/` with Home V2 | deferred |
| qa | browser screenshot QA with final assets | deferred |

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
