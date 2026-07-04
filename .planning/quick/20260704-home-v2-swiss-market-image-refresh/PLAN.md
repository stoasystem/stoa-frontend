---
type: quick
status: complete
created: 2026-07-04
completed: 2026-07-04
---

# Home V2 Swiss-Market Image Refresh

## Goal

Refresh the Home V2 candidate image set after review feedback that the previous shortlist included too many Asian-family scenes for a Swiss-market parent homepage.

## Scope

- Remove local candidates that create a Swiss-market audience mismatch.
- Add free, traceable candidates that better fit Swiss/European parent positioning.
- Prefer real stock photography over AI-generated people.
- Update shortlist documentation and the asset ledger.
- Do not implement images in React routes yet.

## Execution

1. Audited the existing v3.1 shortlist and local candidate files.
2. Downloaded additional ordinary-license Unsplash candidates focused on European-family, parent/child, study-detail, and Swiss-place signals.
3. Removed prior Pexels candidates that were valid learning scenes but wrong for the Swiss-first homepage audience.
4. Updated `docs/home/home-v2-image-shortlist.md`.
5. Updated `docs/home/home-v2-asset-ledger.csv`.
6. Recorded the decision in project state.

## Acceptance

- Active candidate pool no longer includes the rejected Asian-family mismatch set.
- Refreshed shortlist explicitly scores Swiss-parent fit.
- Ledger preserves removed assets as audit history.
- Current homepage implementation remains untouched.
