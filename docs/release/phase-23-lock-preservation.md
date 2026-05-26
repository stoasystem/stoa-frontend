# Phase 23 Lock Preservation

**Phase:** 129 - Blocker Fixes and Release Lock Preservation
**Date:** 2026-05-26
**Commit under verification:** working tree after `8d0677c`

## Approved Fix Scope

Phase 129 only verified and finalized changes mapped to Phase 128 final approval items:

- FAC-001: homepage eyebrow copy changed to "when it is needed" and synced across EN/DE/FR/IT.
- FAC-002: global logo surfaces use `img/logo2.png`.
- FAC-003: footer contrast adjusted against main page background.
- FAC-004: header contrast adjusted against main page background.
- FAC-005: remote public-page images archived under `img/` and referenced locally.

No new product features, pages, languages, navigation changes, demo API changes, or broad copy/design/translation rewrites were added.

## Copy Lock Recheck

| Check | Result | Evidence |
|-------|--------|----------|
| Homepage eyebrow uses approved English wording. | Passed | `src/i18n/locales/en/home.json` contains "Guided learning, with teacher support when it is needed". |
| Old wording removed from user-facing source. | Passed | Source scan found no active UI occurrence of "when it helps"; only release-tracking documentation references the old wording. |
| English copy rules updated for approved exception. | Passed | `docs/language/english-copy-rules.md` now uses "Professional teacher support when it is needed." |
| No new user-facing demo/mock/Codex/fake-checkout wording introduced. | Passed | Targeted source scan found only release/QA documentation references. |

## Design Lock Recheck

| Check | Result | Evidence |
|-------|--------|----------|
| Logo uses approved image asset. | Passed | `StoaLogo` uses `img/logo2.png`; browser check reported header logo rendered at 81 x 44. |
| Header contrast differs from main page background. | Passed | Browser check reported header background `rgba(238, 233, 226, 0.96)`. |
| Footer contrast differs from main page background. | Passed | Browser check reported footer background `rgb(236, 231, 223)`. |
| Mobile layout remains stable. | Passed | 375px and 430px checks on `/` and `/contact` reported no horizontal overflow and no broken images. |

## Translation Lock Recheck

| Locale | Approved homepage eyebrow |
|--------|----------------------------|
| EN | Guided learning, with teacher support when it is needed |
| DE | Geführtes Lernen, mit Lehrperson wenn sie gebraucht wird |
| FR | Apprentissage guidé, avec enseignant quand c’est nécessaire |
| IT | Studio guidato, con insegnante quando è necessario |

All four locales were updated together for the approved FAC-001 exception. Broad translation scope remains locked.

## Demo API Contract Lock Recheck

No service, hook, backend, route contract, environment, or API client file was changed. The final demo API contract lock remains valid with no exception.

## Verification Commands

- `npm run build` - passed.
- `npm run lint` - passed.
- `curl -I http://127.0.0.1:5173/` - returned HTTP 200.
- Playwright desktop smoke for `/`, `/contact`, `/pricing`, `/for-parents`, and `/teacher-support` - passed with zero remote images and zero broken images.
- Playwright mobile smoke at 375px and 430px for `/` and `/contact` - passed with no horizontal overflow and zero broken images.

