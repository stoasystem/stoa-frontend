# Group Learning History Sections Summary

## Status

Complete.

## Changes

- Split `/learning-history` into Question history, Online classroom history, and Practice history sections.
- Kept Online Classroom records linked to their summary pages.
- Added a configurable empty message to the shared history list so each section can show a specific empty state.

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/learning-history`; verified all three sections render and `Linear Equations Review` appears under Online classroom history.
