# Final Approval Changes

**Phase:** Phase 23 public demo release
**Date:** 2026-05-26
**Baseline commit:** `0ddb112`
**Scope rule:** Phase 23 fixes only launch-candidate bugs, required final approval changes, and release blockers. It does not add features, redesign pages, reopen broad copy/design/translation scope, or change product direction.

## Severity Rules

| Priority | Meaning | Required action |
|----------|---------|-----------------|
| P0 | Blocks public demo release or a core flow. | Must fix before release. Cannot be accepted as known issue. |
| P1 | Seriously harms credibility, trust, comprehension, or demo quality. | Fix before release or document an explicit workaround/acceptance. |
| P2 | Non-blocking release-quality issue. | Fix only if low-risk or record as known issue/backlog. |
| P3 | Later polish or future improvement. | Defer to next-stage backlog. |

## Final Approval Items

| ID | Source reviewer | Page | Issue | Required change | Priority | Decision | Status | Next action |
|----|-----------------|------|-------|-----------------|----------|----------|--------|-------------|
| FAC-001 | Browser review | Homepage | Eyebrow copy said "when it helps"; reviewer requested "when it is needed" and language sync. | Update English wording and sync German, French, and Italian locale copy. | P1 | Fix in Phase 23 because public hero copy affects trust and terminology. | Verified | Four locale source check, homepage browser smoke, build, and lint passed in Phase 129. |
| FAC-002 | Browser review | Header / global logo | Text logo should use the provided logo image from `/Users/zhdeng/stoa-frontend/img`. | Use the provided STOA logo image consistently in header/footer logo surfaces. | P1 | Fix in Phase 23 because incorrect brand presentation affects public demo credibility. | Verified | Browser smoke confirmed header logo renders from `img/logo2.png` on key pages. |
| FAC-003 | Browser review | Footer | Footer and main page colors lacked enough contrast. | Give footer a subtle background contrast from the main page while preserving brand direction. | P1 | Fix in Phase 23 because the footer is visible on public/core pages and affects finish quality. | Verified | Browser smoke confirmed footer background contrast and no checked mobile overflow. |
| FAC-004 | Browser review | Header | Header and main page colors lacked enough contrast. | Give sticky header a subtle background contrast from the main page while keeping navigation readable. | P1 | Fix in Phase 23 because navigation is always visible and impacts trust. | Verified | Browser smoke confirmed header background contrast and no checked mobile overflow. |
| FAC-005 | Browser review | Global imagery | Other image files should be organized under `/Users/zhdeng/stoa-frontend/img`. | Archive remote/public image assets into the local `img/` folder and update code references. | P2 | Fix accepted because the change is low-risk, improves release stability, and avoids remote image dependency during demo. | Verified | Source scan, build output, and browser smoke confirmed local images with no remote/broken checked images. |

## Launch-Candidate Bug Triage

| ID | Priority | Surface | Description | Decision | Status | Next action |
|----|----------|---------|-------------|----------|--------|-------------|
| BUG23-001 | P1 | Homepage copy | Teacher support eyebrow copy did not match final approval wording. | Fix required; aligned through FAC-001. | Verified | Phase 129 source and browser checks passed. |
| BUG23-002 | P1 | Branding | Header/footer used a text logo instead of the provided logo asset. | Fix required; aligned through FAC-002. | Verified | Phase 129 source and browser checks passed. |
| BUG23-003 | P1 | Header/footer visual finish | Header and footer needed clearer contrast against the main page. | Fix required; aligned through FAC-003 and FAC-004. | Verified | Phase 129 desktop/mobile browser checks passed. |
| BUG23-004 | P2 | Image assets | Public pages depended on remote image URLs rather than local archived assets. | Low-risk fix accepted; aligned through FAC-005. | Verified | Phase 129 source, build, and browser image checks passed. |
| BUG23-005 | P2 | Browser/device QA | Safari, Firefox, Edge, Mobile Safari, and Android Chrome manual passes were not yet recorded in LC1 known issues. | Defer to Phase 130 final responsive/browser smoke evidence. | Open | Record results or accepted limitation in public demo final run. |
| BUG23-006 | P2 | Accessibility QA | Manual screen-reader smoke remained unrecorded in LC1 known issues. | Defer to Phase 130 accessibility smoke evidence. | Open | Record final accessibility smoke result. |
| BUG23-007 | P2 | Translation QA | Native-speaker review remains recommended for German, French, and Italian. | Keep as known limitation unless a blocking locale defect is found. | Deferred | Do not reopen broad translation scope in Phase 23. |

## P0 / P1 Summary

- P0 count: 0 known at Phase 128 close.
- P1 count: 3 grouped blockers, fixed and verified in Phase 129.
- P1 release rule: no P1 may remain open without a documented workaround and explicit acceptance.

## Phase 129 Fix Scope

Phase 129 may only:

- Verify and finalize the existing FAC-001 through FAC-005 fixes.
- Adjust those fixes if verification finds a concrete regression.
- Update related release-lock evidence if a fix touches copy, design, translation, or API assumptions.

Phase 129 must not:

- Add new product features.
- Redesign pages or navigation.
- Add new languages.
- Reopen broad copy, design, or translation work.
- Change the demo API contract unless a P0 blocker is found.
