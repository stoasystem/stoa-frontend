# v7 Release Handoff

**Date:** 2026-07-07
**Status:** v7 execution complete

## Completed

- Full-site runtime language support expanded from EN/DE to EN/DE/FR/IT.
- Shared `LanguageSwitcher` now inherits all four launch languages.
- Home V2 now has a dedicated high-end language control on desktop and mobile.
- `/privacy` and `/terms` are localized through a new `legal` namespace.
- Legal/privacy/terms source notes and candidate draft status docs were created.
- Online Classroom user-visible mock/demo wording was removed from locale values.
- v7 planning, glossary, tone, QA, legal, and handoff docs were created.

## Verification

Passed:

- `npm run lint`
- `npm run build`
- `npm run test:e2e -- home-v2.spec.ts localization-preferences.spec.ts`
- EN/DE/FR/IT JSON key parity script
- user-facing locale value scan for internal/raw terms

Build note:

- Vite still reports the existing chunk-size warning for large bundles. This is not introduced by v7.

## Sources Used For Legal/Language Research

- Swiss FADP/DSG on Fedlex: https://www.fedlex.admin.ch/eli/cc/2022/491/en
- FDPIC: https://www.edoeb.admin.ch/en
- FDPIC Data Protection: https://www.edoeb.admin.ch/en/data-protection
- EU GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- FDFA Switzerland language reference: https://www.aboutswitzerland.eda.admin.ch/en/language

## Deferred

| Item | Reason |
|------|--------|
| Runtime Romansh | Acknowledged and intentionally deferred until audience need, legal requirement, or budget justifies it. |
| Final legal approval | Requires qualified legal review and confirmed company/process facts. |
| Full route screenshot matrix | Recommended before a public switch-over or broad launch, but focused E2E/runtime verification passed. |
| `/home-v2` replacing `/` | Still out of scope and requires separate explicit approval. |

## Next Step

If continuing immediately, the next practical program is final visual screenshot QA for EN/DE/FR/IT P0 routes, then a separate switch-over decision if `/home-v2` should ever replace `/`.
