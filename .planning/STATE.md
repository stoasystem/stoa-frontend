---
gsd_state_version: 1.0
milestone: v6.2
milestone_name: Home V2 Trust And Assurance Redesign
status: complete
last_updated: "2026-07-05T21:12:45Z"
last_activity: 2026-07-05 — /home-v2 homepage copy rewritten around Start with the question narrative
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-05)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.
**Current focus:** Milestone v6.2 Home V2 Trust And Assurance Redesign is complete. The Trust section now uses a warm image-led assurance layout with precise principles, Apple-like restraint, and no repeated "Swiss" or loud privacy marketing.

## Current Position

Phase: 256 — Trust Verification And Visual QA
Plan: 256-PLAN.md
Status: Complete
Last activity: 2026-07-05 — v6.2 Trust/Assurance completed with lint, build, Home V2 E2E, copy discipline, and screenshot QA

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 5 of 5
- Average duration: same-day design/implementation cycle
- Total execution time: 2026-07-05

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 252 | 1/1 | Complete | 2026-07-05 |
| 253 | 1/1 | Complete | 2026-07-05 |
| 254 | 1/1 | Complete | 2026-07-05 |
| 255 | 1/1 | Complete | 2026-07-05 |
| 256 | 1/1 | Complete | 2026-07-05 |

**Recent Trend:**

- Last 5 completed phases: 252, 253, 254, 255, 256
- Trend: v6.2 completed the Trust/Assurance arc from art direction through implementation and verification.

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
- 2026-07-05 v6.1 starts Parent Confidence as an emotional reassurance section: parents stay close without anxious intervention, and the section should use one quiet progress note rather than feature pills or dashboard language.
- 2026-07-05 v6.2 starts Trust/Assurance as an image-led editorial assurance section: trust should feel built into restraint, boundaries, and visual order rather than repeated "Swiss" or privacy slogans.
- 2026-07-05 v6.2 completed Trust/Assurance with one warm learning-detail image, four fine-line principles, restrained EN/DE/FR/IT copy, scoped Trust styling, and Home V2 E2E coverage.

### Quick Tasks Completed

| Date | Task | Outcome |
|------|------|---------|
| 2026-07-05 | Home V2 homepage copy rewrite | Rewrote EN/DE/FR/IT `/home-v2` copy around "Start with the question", teacher support as system backbone, clearer parent learning view, and proportional support; verified JSON, copy discipline, lint, build, E2E, and screenshots. |
| 2026-07-05 | Home V2 Parent Confidence and Trust milestone split | Created v6.1 Parent Confidence redesign and v6.2 Trust/Assurance redesign requirements/roadmaps from grill-me decisions. |
| 2026-07-05 | Home V2 Parent Confidence redesign | Replaced dashboard-like pills with one calm weekly note, updated EN/DE/FR/IT copy, verified desktop/tablet/mobile screenshots, lint, build, and Home V2 E2E. |
| 2026-07-05 | Home V2 Trust/Assurance redesign | Replaced Trust feature cards with one warm image, fine-line assurance principles, restrained four-language copy, scoped Trust styling, screenshots, lint, build, and Home V2 E2E. |
| 2026-07-05 | Home V2 Learning Thread card alternation | Moved beat 04 to the right-side grid position on desktop/tablet layouts while keeping mobile single-column behavior. |
| 2026-07-05 | Email verification Unauthorized fix | Kept public auth endpoints free of stale bearer tokens, mapped 401 verification failures to recovery copy, and verified the stale-token login/resend/confirm flow with auth e2e coverage. |
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

- Future Home V2 implementation work: final paid/commissioned photography, crop variants, image optimization, WebP/AVIF generation, full-page motion choreography, visual regression, and `/` switch approval remain out of scope until separately planned.

### Blockers/Concerns

- Free Pexels/Unsplash candidates and current preview images are suitable for prototype/preview but may not fully express Swiss private-school tone. A paid iStock or commissioned search may still be needed for final public Hero and Trust photography.
- Identifiable people appear in the downloaded candidates. Public use must avoid implying endorsement, negative portrayal, surveillance, or guaranteed educational outcomes.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| paid_assets | iStock purchase and final license approval | deferred |
| asset_pipeline | crop/optimization/WebP variants | deferred |
| implementation | Home V2 preview asset insertion | partial |
| motion | Learning Thread animation implemented; remaining section-level choreography deferred | partial |
| copy | final EN/DE/FR/IT homepage copywriting | deferred |
| switch_over | replacing `/` with Home V2 | deferred |
| qa | browser screenshot QA with prototype assets | partial |

## Operator Next Steps

- v6.2 is complete. Recommended next milestone: final Home V2 image/photography replacement and full-page visual QA before any `/` switch decision.
