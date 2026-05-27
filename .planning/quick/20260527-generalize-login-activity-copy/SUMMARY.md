# Generalize Login Activity Copy Summary

## Status

Complete.

## Changes

- Replaced the login page pre-auth activity labels with broader learning-oriented copy.
- Removed equation-specific and request-count-specific wording from the public login hero.
- Updated English, German, French, and Italian auth locale files.

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/login?next=/chat` confirmed the old subject-specific strings are gone and the generic activity copy is visible.
