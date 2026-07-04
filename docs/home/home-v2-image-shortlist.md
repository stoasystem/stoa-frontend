# Home V2 Candidate Image Search And Shortlist

**Date:** 2026-07-04
**Status:** Swiss-market refresh complete
**Depends on:** `docs/home/home-v2-information-architecture.md`, `docs/home/home-v2-visual-direction.md`, `docs/home/home-v2-image-asset-strategy.md`
**Skill input:** `high-end-visual-design`

## Purpose

This document refreshes the Home V2 image shortlist after review feedback that the previous candidate set included too many Asian-family scenes for a Swiss-market parent homepage. The new screen prioritizes Swiss/European audience fit, restrained premium education tone, and non-AI-looking learning moments.

Current `/` remains unchanged. No React components, localized JSON, or route behavior were modified in this refresh.

## Swiss Market Correction

The previous v3.1 set was too broad: several images were valid learning scenes, but the people and setting did not fit a Swiss-first homepage aimed at parents. For this market, demographic/context fit is not a decorative issue; it affects trust, relevance, and perceived product maturity.

Removed from the active candidate pool:

- `PEX-8055080` - authentic family homework scene, but not suitable as a Swiss-market family signal.
- `PEX-8054838` - close learning detail from the same mismatch set.
- `PEX-8055125` - parent-confidence image from the same mismatch set.
- `PEX-9240631` - visually relevant, but deferred due education-brand/vendor adjacency risk.

The refreshed pool now keeps three useful Pexels assets and adds seven Unsplash assets focused on European-family scenes, face-light study details, and Swiss place signal.

## Source Decisions

### Pexels

Pexels remains allowed for downloaded free candidates.

Reason:

- Pexels states photos and videos can be downloaded and used for free.
- Attribution is not required, though STOA still records creator/source internally.
- Pexels allows online website/app use and product promotion use.
- Restrictions still apply: no negative/offensive portrayal of identifiable people, no implied endorsement, no redistribution on stock platforms, and no trademark/service-mark use.

### Unsplash

Unsplash was added in this Swiss-market refresh.

Reason:

- Unsplash allows free download and use for commercial and non-commercial purposes under its license.
- Attribution is appreciated but not required.
- Restrictions still apply: do not sell unmodified images, do not compile a competing image service, and do not imply endorsement by identifiable people.
- Unsplash+ / premium assets were excluded. Only ordinary `images.unsplash.com` assets were downloaded.

### iStock

iStock remains paid and approval-gated.

Reason:

- iStock offers standard and extended licenses.
- Watermarked content is for test/sample layout only and cannot be used in final or public materials.
- Paid download requires budget and purchase approval.

Recommended paid search starts for later approval:

- `Swiss family studying at home`
- `European parent child homework premium`
- `private school family Switzerland`
- `international school student studying`
- `Swiss education family learning`

### Magnific

Magnific remains workflow/source-gated.

Reason:

- Magnific combines licensed stock access with AI generation, editing, upscaling, and model-driven workflows.
- It may be useful for future enhancement, but this workstream should avoid AI-generated family/child imagery for the homepage.

## Downloaded Candidate Set

Downloaded files live under:

```text
img/home-v2/candidates/pexels/
img/home-v2/candidates/unsplash/
```

Metadata ledger:

```text
docs/home/home-v2-asset-ledger.csv
```

## Shortlist Summary

| Section | Recommended candidate | Local file | Decision |
|---------|------------------------|------------|----------|
| Hero | PEX-8121121 | `img/home-v2/candidates/pexels/hero-family-study-table-pexels-8121121.jpg` | Still the best current free Hero candidate: real family-learning scene, European enough, strong crop flexibility. |
| Hero backup | UNS-1758687126234 | `img/home-v2/candidates/unsplash/father-son-laptop-unsplash-1758687126234.jpg` | Better parent/child market fit, but warmer and more ad-like than ideal. Use only after crop/color test. |
| Hero seasonal backup | UNS-1549227082 | `img/home-v2/candidates/unsplash/hero-family-reading-unsplash-1549227082.jpg` | European family reading moment, but the Christmas setting makes it seasonal. Do not use as evergreen Hero without approval. |
| Learning Thread | UNS-1434030216411 | `img/home-v2/candidates/unsplash/student-study-desk-unsplash-1434030216411.jpg` | Strong face-light study detail; avoids demographic mismatch while still showing active learning. |
| Learning Thread backup | UNS-1585432959322 or PEX-4022327 | `img/home-v2/candidates/unsplash/study-desk-writing-unsplash-1585432959322.jpg` / `img/home-v2/candidates/pexels/learning-thread-worksheets-pexels-4022327.jpg` | Useful worksheet/stuck-question detail; watch visible US-style curriculum cues. |
| Parent Confidence | UNS-1758687126234 | `img/home-v2/candidates/unsplash/father-son-laptop-unsplash-1758687126234.jpg` | Best refreshed parent-support scene, but needs color restraint. |
| Swiss Trust Layer | UNS-1559754417 | `img/home-v2/candidates/unsplash/swiss-education-environment-unsplash-1559754417.jpg` | Place signal only. Pair with learning detail; do not use as proof by itself. |
| Final CTA | UNS-1488190211105 or cropped PEX-8121121 | `img/home-v2/candidates/unsplash/study-desk-minimal-unsplash-1488190211105.jpg` | Quiet detail image can close the page without starting a new visual story. |

## Candidate Scoring

Scores use 1-5, where 5 is strongest.

| ID | Role | Authenticity | Swiss-parent fit | Learning relevance | Crop flexibility | Diversity/age fit | Brand fit | Risk | Decision |
|----|------|--------------|-------------------|--------------------|------------------|-------------------|-----------|------|----------|
| PEX-8121121 | Hero | 4 | 4 | 5 | 5 | 4 | 4 | 4 | Primary free Hero candidate. Still not perfect Swiss-private-school tone, but best available free family scene. |
| PEX-4022327 | Learning evidence backup | 4 | 3 | 5 | 5 | 4 | 3 | 4 | Useful worksheet/stuck-question asset; more North American than Swiss premium. |
| PEX-9872951 | Teacher Support | 4 | 2 | 5 | 4 | 5 | 3 | 4 | Keep as deferred teacher-support metaphor, not Swiss-market homepage lead image. |
| UNS-1549227082 | Hero seasonal backup | 4 | 4 | 4 | 4 | 4 | 3 | 4 | European family reading scene; seasonal Christmas context limits evergreen use. |
| UNS-1585432959445 | Learning Thread backup | 4 | 3 | 5 | 4 | 3 | 3 | 4 | Parent/child table scene; market fit improved, visual tone still ordinary. |
| UNS-1758687126234 | Parent Confidence / Hero backup | 3 | 4 | 4 | 4 | 3 | 3 | 4 | Stronger Swiss/European family fit; warm orange treatment needs restraint. |
| UNS-1434030216411 | Learning Thread detail | 4 | 5 | 5 | 5 | 4 | 4 | 5 | Best face-light detail candidate; avoids market mismatch and supports premium editorial layout. |
| UNS-1585432959322 | Learning detail backup | 4 | 3 | 5 | 5 | 4 | 3 | 4 | Good close study moment; visible worksheet language may read US-school. |
| UNS-1488190211105 | CTA / trust detail | 4 | 4 | 4 | 5 | 4 | 4 | 5 | Neutral study detail with no face mismatch; useful for closing or proof surfaces. |
| UNS-1559754417 | Swiss Trust Layer | 4 | 5 | 2 | 5 | 3 | 4 | 5 | Good Swiss place cue; must be paired with education imagery. |

## High-End Visual Review

The corrected direction is stricter: for a Swiss-market parent homepage, the people and setting must feel locally plausible before an image earns a main visual role. A generic "family learning" image is not enough if the family/context reads as the wrong market.

Best current free Hero path:

1. Use `PEX-8121121` as the prototype Hero if a full-family scene is required now.
2. Test `UNS-1758687126234` as a parent-confidence or secondary Hero crop if the page needs a closer parent/child moment.
3. Use `UNS-1434030216411`, `UNS-1488190211105`, and `UNS-1559754417` to create a more Swiss, less stock-heavy visual system around the Hero.

Remaining constraint:

- The free set is now market-appropriate enough for prototype work.
- It is still not enough for final high-end Swiss private-education positioning.
- A paid iStock search or commissioned Swiss family/education shoot remains the best route for the final public Hero.

## Download Verification

Downloaded image dimensions:

| File | Dimensions |
|------|------------|
| `hero-family-study-table-pexels-8121121.jpg` | 7952 x 5304 |
| `learning-thread-worksheets-pexels-4022327.jpg` | 4608 x 3072 |
| `teacher-support-study-pexels-9872951.jpg` | 5472 x 3648 |
| `father-son-laptop-unsplash-1758687126234.jpg` | 2400 x 1350 |
| `hero-family-reading-unsplash-1549227082.jpg` | 2400 x 1600 |
| `parent-child-table-unsplash-1585432959445.jpg` | 2400 x 1600 |
| `student-study-desk-unsplash-1434030216411.jpg` | 2400 x 1600 |
| `study-desk-minimal-unsplash-1488190211105.jpg` | 2400 x 1600 |
| `study-desk-writing-unsplash-1585432959322.jpg` | 2400 x 1600 |
| `swiss-education-environment-unsplash-1559754417.jpg` | 2400 x 1600 |

All downloaded files are JPEG images and remain candidates, not final optimized implementation assets.

## Next Handoff

The next Home V2 implementation milestone should:

1. Choose whether `PEX-8121121` is acceptable as a prototype Hero or whether the Hero should stay blocked pending paid/commissioned sourcing.
2. Generate responsive crops from selected originals.
3. Produce optimized public variants, likely WebP plus JPEG fallback.
4. Add final localized alt text in EN/DE/FR/IT.
5. Insert assets into `/home-v2` only, not `/`.
6. Run desktop/mobile screenshots before any switch-over decision.

## v3.1 Swiss-Market Refresh Completion Map

| Item | Outcome | Evidence |
|------|---------|----------|
| Market correction | Asian-family mismatch candidates removed from active pool and local files | Four prior Pexels files removed. |
| Source refresh | Unsplash ordinary-license candidates added; Unsplash+ excluded | Seven local Unsplash JPEGs. |
| Visual scoring | Candidate scores revised around Swiss-parent fit | Updated score table and ledger. |
| Handoff | Final Hero still recommended as paid/commissioned if aiming for premium Swiss positioning | Next handoff and remaining constraint notes. |
