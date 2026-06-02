# Remove Chat Extra Navigation Buttons Summary

## Status

Complete.

## Changes

- Removed Learning history and Profile from `ChatPageNavigation`.
- Kept Dashboard available in both expanded and compact Chat navigation.

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/chat`; verified Dashboard is present and Learning history/Profile are absent from the Chat local navigation.
