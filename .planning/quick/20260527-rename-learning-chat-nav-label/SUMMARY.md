# Rename Learning Chat Navigation Label Summary

## Status

Complete.

## Changes

- Renamed the student `/chat` navigation label from "Learning Chat" to "Ask a question".
- Synced the navigation label across English, German, French, and Italian.
- Replaced nearby user-facing Practice/Dashboard copy that used "Learning Chat" as a feature label with clearer action-oriented wording.
- Updated related Practice, pricing, learning-history, and mock summary copy so the old label does not reappear in normal UI.

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/practice` after student sign-in at desktop and mobile widths.
- Verified visible page text no longer contains "Learning Chat" and navigation shows "Ask a question".
