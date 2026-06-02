# Move Classroom Sessions To Learning History Summary

## Status

Complete.

## Changes

- Removed Recent Sessions from the Online Classroom home page.
- Added completed classroom sessions to the student Learning History page.
- Added optional links/source labels to learning history items so classroom records show `Online Classroom` and link to their summary page.

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/classroom`; verified Recent Sessions is no longer visible.
- Browser check on `/learning-history`; verified `Linear Equations Review` appears with `ONLINE CLASSROOM`.
