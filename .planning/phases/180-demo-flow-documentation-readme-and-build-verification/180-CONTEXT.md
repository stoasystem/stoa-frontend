# Phase 180 Context: Demo Flow, Documentation, README, and Build Verification

**Created:** 2026-05-27
**Milestone:** v1.31 Phase 33

## Scope

Phase 180 closes Phase 33 by documenting the homepage Practice entry funnel, creating the QA checklist, updating README, running the homepage-to-Practice demo verification, and confirming the production build.

## Inputs

- Phase 177 route contract:
  - visitor -> `/login?next=/practice`
  - student -> `/practice`
  - parent -> `/parent`
  - tutor -> `/tutor`
  - admin -> `/admin`
- Phase 178 homepage Practice entry UI:
  - `HomePracticeEntry`
  - `PracticeEntryCard`
  - `HomePracticePreview`
- Phase 179 four-language browser QA:
  - EN/DE/FR/IT verified at 320, 375, 430, 768, 1024, and 1440 px
  - `npm run build` passed

## Constraints

- Practice remains one entry into the learning platform, not the whole STOA product.
- No new curriculum, backend, database, analytics, or complex gamification work.
- Documentation must preserve the hierarchy: Practice -> Learning Chat -> Professional Teacher Support -> Parent Report.

