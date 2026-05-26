# Phase 32 French Final Review

## Scope

Reviewed French locale files for auth, billing, chat, home, common navigation, and teacher-support language.

## Findings And Fixes

- Chat error copy was rewritten into natural user-facing retry language.
- Billing review keys were renamed away from mock-checkout terminology while preserving `sélection du plan`.
- Apostrophes in user-facing French strings use typographic `’`.
- Practice and Learning Chat wording remains clear and avoids overly abstract phrasing.

## Tone Review

French copy is clear, restrained, and education-oriented. It avoids literal English structure where a shorter French phrase reads more naturally.

## Known Gaps

Some route aliases and internal code identifiers remain English and are outside user-facing copy scope.

## Decision

Approved for Phase 32 implementation verification.
