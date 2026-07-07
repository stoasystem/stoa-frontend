# v7 Milestone Audit: Full-Site Multilingual Adaptation Execution

**Date:** 2026-07-07
**Status:** Complete
**Scope:** Runtime multilingual enablement, language controls, legal candidate localization, copy QA documentation, and verification.

## Summary

v7 completed the full-site multilingual adaptation execution pass. The frontend now supports English, German, French, and Italian at runtime. Home V2 has a dedicated premium language control on desktop and mobile. Privacy and Terms pages are localized through a new legal namespace and clearly marked as lawyer-review candidate copy.

Current `/` remains unchanged. `/home-v2` remains a preview route. Romansh remains acknowledged and deferred.

## Requirements Coverage

| Area | Requirements | Status |
|------|--------------|--------|
| Language policy and runtime | LANG-01 through LANG-04 | Complete |
| Language controls | CONTROL-01 through CONTROL-04 | Complete |
| Copy and tone coverage | COPY-01 through COPY-04 | Complete |
| Legal and compliance draft readiness | LEGAL-01 through LEGAL-04 | Complete |
| QA and handoff | QA-01 through QA-05 | Complete |

Coverage result: 21/21 requirements mapped and completed.

## Delivered Code

- `src/i18n/languages.ts`
- `src/i18n/index.ts`
- `src/i18n/namespaces.ts`
- `src/components/home-v2/HomeV2PremiumHeader.tsx`
- `src/styles/home-v2-premium.css`
- `src/pages/legal/PrivacyPage.tsx`
- `src/pages/legal/TermsPage.tsx`
- `src/lib/localeLayout.ts`
- `src/components/contact/ContactForm.tsx`
- `src/i18n/locales/*/legal.json`
- `src/i18n/locales/*/liveClassroom.json`
- `tests/e2e/home-v2.spec.ts`
- `tests/e2e/localization-preferences.spec.ts`

## Delivered Documentation

- `docs/i18n/v7-multilingual-adaptation-plan.md`
- `docs/i18n/v7-glossary-terminology-matrix.md`
- `docs/i18n/v7-tone-and-quality-rules.md`
- `docs/i18n/v7-route-qa-matrix.md`
- `docs/i18n/v7-program-roadmap.md`
- `docs/i18n/v7-copy-qa-report.md`
- `docs/i18n/v7-release-handoff.md`
- `docs/legal/v7-privacy-terms-research-plan.md`
- `docs/legal/v7-legal-source-notes.md`
- `docs/legal/v7-privacy-terms-candidate-drafts.md`

## Verification

Passed:

- `npm run lint`
- `npm run build`
- `npm run test:e2e -- home-v2.spec.ts localization-preferences.spec.ts`
- EN/DE/FR/IT JSON key parity script
- user-facing locale value scan for uppercase `AI`, artificial intelligence, mock, demo, Codex, provider, and prompt
- `git diff --check`

Build note:

- Vite reports the existing chunk-size warning. This is unchanged by v7 and is not a v7 blocker.

## Deferred Items

| Item | Reason |
|------|--------|
| Runtime Romansh | Acknowledged and deferred until audience need, legal requirement, or budget justifies it. |
| Final legal approval | Requires qualified legal review and confirmed business/process facts. |
| Full route screenshot matrix | Recommended before broad launch or Home V2 switch-over. |
| `/home-v2` to `/` switch-over | Requires separate explicit approval and switch-over plan. |

## Conclusion

v7 is complete. The frontend now has four-language runtime support and localized legal candidate pages. Remaining work is external review or separate release/switch-over preparation, not unfinished v7 implementation.
