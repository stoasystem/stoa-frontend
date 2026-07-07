# v7 Copy QA Report

**Date:** 2026-07-07
**Status:** Completed for v7 execution

## Scope

This report records the copy and runtime checks performed for the v7 full-site multilingual adaptation pass.

Launch runtime languages:

- EN
- DE
- FR
- IT

Romansh is acknowledged in policy and deferred from runtime.

## Runtime Coverage

Completed:

- `supportedLanguages` now includes EN/DE/FR/IT.
- `languageOptions` now exposes EN/DE/FR/IT.
- FR/IT resources are imported and registered in `src/i18n/index.ts`.
- The `legal` namespace is registered and available in all four launch languages.
- Existing language persistence and `document.documentElement.lang` syncing now accept FR/IT.

## Language Controls

Completed:

- Shared public/app `LanguageSwitcher` now renders EN/DE/FR/IT through the shared language options.
- Home V2 desktop now has a premium inline segmented language control.
- Home V2 mobile menu now includes EN/DE/FR/IT language chips inside the expanded menu.
- Home V2 language controls use text labels only, no flags and no dropdown.

## P0 Public/Auth/Home Checks

Checked:

- `/`
- `/home-v2`
- `/login`
- `/register`
- `/pricing`
- `/contact`
- `/support`
- `/privacy`
- `/terms`

Implementation outcome:

- Public switcher runtime is covered by E2E.
- Home V2 desktop/mobile control runtime is covered by E2E.
- Privacy and Terms moved from hardcoded English to localized `legal` namespace.
- Existing public/auth/pricing/contact/support namespaces have EN/DE/FR/IT key parity.

## Core Product Role Checks

Checked namespaces:

- `chat`
- `practice`
- `questionBank`
- `uploads`
- `liveClassroom`
- `parent`
- `tutor`

Implementation outcome:

- EN/DE/FR/IT key parity passes.
- Online Classroom visible `mock/demo` wording was removed from runtime values.
- Product wording continues to avoid public AI-solver framing.

## Admin/Ops/Billing/Edge Checks

Checked namespaces:

- `admin`
- `billing`
- `support`
- `contact`
- `errors`
- `common`

Implementation outcome:

- EN/DE/FR/IT key parity passes.
- Value scan for uppercase `AI`, artificial intelligence, mock, demo, Codex, provider, and prompt passes after excluding key names and checking user-facing values.

## Known Limits

- This pass validates locale structure, runtime switching, and focused P0 controls. It does not replace full human copy review by native editors.
- Legal pages remain lawyer-review candidate copy, not final legal advice.
- Full screenshot matrix for every P0/P1 route remains recommended before public switch-over or broad launch.

## Verification Commands

Passed:

```bash
npm run lint
npm run build
npm run test:e2e -- home-v2.spec.ts localization-preferences.spec.ts
```

Static checks passed:

- EN/DE/FR/IT JSON key parity.
- user-facing locale value scan for internal/raw terms.
