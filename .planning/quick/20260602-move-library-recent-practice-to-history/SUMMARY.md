# Move Library Recent Practice To History Summary

## Status

Complete.

## Changes

- Removed Recent Practice from the Library home page.
- Added Library recent practice sets to Learning History under Practice history.
- Practice history records are labeled `Practice Library` and link back to their set pages.

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/question-bank`; verified Recent Practice is no longer visible.
- Browser check on `/learning-history`; verified recent Library sets appear under Practice history.
