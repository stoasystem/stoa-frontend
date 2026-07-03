# Home V2 Candidate Image Search And Shortlist

**Date:** 2026-07-03
**Status:** Final for v3.1
**Depends on:** `docs/home/home-v2-information-architecture.md`, `docs/home/home-v2-visual-direction.md`, `docs/home/home-v2-image-asset-strategy.md`
**Skill input:** `high-end-visual-design`

## Purpose

This document moves Home V2 from image strategy into a concrete candidate shortlist. It records searched sources, downloaded free candidates, visual scoring, license notes, and next-step handoff for a later Home V2 implementation milestone.

Current `/` remains unchanged. No React components, localized JSON, or route behavior were modified in this milestone.

## Source Decisions

### Pexels

Pexels is the only source downloaded in v3.1.

Reason:

- Pexels states photos and videos can be downloaded and used for free.
- Attribution is not required, though STOA still records creator/source internally.
- Pexels allows online website/app use and product promotion use.
- Restrictions still apply: no negative/offensive portrayal of identifiable people, no implied endorsement, no redistribution on stock platforms, and no trademark/service-mark use.

### iStock

iStock remains paid and approval-gated.

Reason:

- iStock offers standard and extended licenses.
- Watermarked content is for test/sample layout only and cannot be used in final or public materials.
- Paid download requires budget and purchase approval.

No iStock file was downloaded in v3.1.

Recommended paid search starts for later approval:

- `family homework Europe`
- `parent child studying`
- `private education family`
- `teacher helping student homework`
- `study desk school materials`

### Magnific

Magnific remains workflow/source-gated.

Reason:

- Magnific combines licensed stock access with AI generation, editing, upscaling, and model-driven workflows.
- It may be useful for future stock/API access or enhancement, but v3.1 avoids AI-generated family/child imagery.

No Magnific file was downloaded in v3.1.

## Downloaded Candidate Set

Downloaded files live under:

```text
img/home-v2/candidates/pexels/
```

Metadata ledger:

```text
docs/home/home-v2-asset-ledger.csv
```

## Shortlist Summary

| Section | Recommended candidate | Local file | Decision |
|---------|------------------------|------------|----------|
| Hero | PEX-8121121 | `img/home-v2/candidates/pexels/hero-family-study-table-pexels-8121121.jpg` | Best free candidate found. Use as Hero first-pass asset. |
| Learning Thread | PEX-8054838 | `img/home-v2/candidates/pexels/learning-thread-close-study-pexels-8054838.jpg` | Strong close learning detail; good for scroll narrative. |
| Parent Confidence | PEX-8055125 | `img/home-v2/candidates/pexels/parent-confidence-kitchen-pexels-8055125.jpg` | Quiet parent presence; useful vertical module image. |
| Swiss Trust Layer | PEX-4022327 or future paid/detail asset | `img/home-v2/candidates/pexels/learning-thread-worksheets-pexels-4022327.jpg` | Current best free evidence/detail asset, but not strongly Swiss. Consider paid/source search later. |
| Final CTA | Reuse cropped Hero or Parent Confidence image | PEX-8121121 or PEX-8055125 | Do not introduce a new visual story at final CTA. |

## Candidate Scoring

Scores use 1-5, where 5 is strongest.

| ID | Role | Authenticity | Swiss-parent fit | Learning relevance | Crop flexibility | Diversity/age fit | Brand fit | Risk | Decision |
|----|------|--------------|-------------------|--------------------|------------------|-------------------|-----------|------|----------|
| PEX-8121121 | Hero | 4 | 4 | 5 | 5 | 4 | 4 | 4 | Primary Hero candidate. |
| PEX-8055080 | Parent Confidence backup | 4 | 3 | 5 | 4 | 4 | 3 | 4 | Backup/supporting image. |
| PEX-8054838 | Learning Thread | 4 | 3 | 5 | 5 | 4 | 4 | 4 | Primary narrative detail candidate. |
| PEX-8055125 | Parent Confidence | 4 | 3 | 5 | 4 | 4 | 4 | 4 | Primary parent-confidence candidate. |
| PEX-4022327 | Learning evidence backup | 4 | 3 | 5 | 5 | 4 | 3 | 4 | Useful worksheet/stuck-question asset. |
| PEX-9872951 | Teacher Support | 4 | 3 | 5 | 4 | 5 | 4 | 4 | Good tutor-support metaphor. |
| PEX-9240631 | Deferred | 3 | 4 | 5 | 5 | 4 | 3 | 3 | Defer due education-brand/vendor adjacency. |

## High-End Visual Review

The best candidate is **PEX-8121121** because it gives Home V2 a real, calm family-learning scene with soft natural light, European home context, and enough negative space/crop flexibility for the v2.7 Editorial Split composition. It can sit inside a double-bezel image frame without reading as AI spectacle or a generic SaaS dashboard.

Observed constraints:

- None of the free candidates fully solve "Swiss private-school" tone.
- The Pexels set is good enough for prototype and early Home V2 implementation.
- A paid search may still be worthwhile for the final Hero if the page needs a more distinctly Swiss/European premium education signal.
- Avoid PEX-9240631 as final public Hero unless approved because the source/vendor name creates education-brand adjacency.

## Download Verification

Downloaded image dimensions:

| File | Dimensions |
|------|------------|
| `hero-family-study-table-pexels-8121121.jpg` | 7952 x 5304 |
| `learning-thread-close-study-pexels-8054838.jpg` | 6000 x 4000 |
| `learning-thread-worksheets-pexels-4022327.jpg` | 4608 x 3072 |
| `parent-confidence-kitchen-pexels-8055125.jpg` | 4000 x 6000 |
| `parent-homework-living-room-pexels-8055080.jpg` | 6000 x 4000 |
| `parent-learning-laptop-pexels-9240631.jpg` | 6720 x 4480 |
| `teacher-support-study-pexels-9872951.jpg` | 5472 x 3648 |

All downloaded files are JPEG images and remain candidates, not final optimized implementation assets.

## Next Handoff

The next Home V2 implementation milestone should:

1. Choose whether PEX-8121121 is acceptable as the prototype Hero.
2. Generate responsive crops from selected originals.
3. Produce optimized public variants, likely WebP plus JPEG fallback.
4. Add final localized alt text.
5. Insert assets into `/home-v2` only, not `/`.
6. Run desktop/mobile screenshots before any switch-over decision.

## v3.1 Phase Completion Map

| Phase | Outcome | Evidence |
|-------|---------|----------|
| 240 | Source search and license screen completed | Pexels candidate search, iStock/Magnific gates, source notes. |
| 241 | High-end visual scoring completed | Candidate score table and section recommendations. |
| 242 | Downloads and metadata completed | 7 local Pexels JPEGs and CSV ledger. |
| 243 | Handoff completed | Next implementation scope and QA boundaries. |
