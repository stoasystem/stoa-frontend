# Phase 16 Research: Architecture

## Integration Points

### App Bootstrap

`src/main.tsx` should import `@/i18n` before rendering the app so React components can call `useTranslation`.

The i18n initializer should also set `document.documentElement.lang` on first load and after language changes. W3C guidance favors language attributes on the `html` element for text-processing language, so this should be part of the frontend architecture rather than only a UI preference.

### Locale Structure

Use this structure:

```text
src/i18n/
  index.ts
  languages.ts
  namespaces.ts
  locales/
    en/
    de/
    fr/
    it/
```

Namespaces should match product areas:

- `common`
- `home`
- `auth`
- `chat`
- `parent`
- `tutor`
- `pricing`
- `billing`
- `support`
- `admin`
- `errors`

### Component Usage

Use `useTranslation(namespace)` for plain strings. Use `Trans` only when translations need inline React elements or links. Avoid translating by assembling long sentences from fragments; German, French, and Italian grammar may require different word order.

### Language Switcher

Create `src/components/common/LanguageSwitcher.tsx`.

Responsibilities:

- Read `i18n.language`.
- Render language names.
- Call `i18n.changeLanguage`.
- Store `stoa_language` in `localStorage`.
- Update `document.documentElement.lang`.

The switcher should be reusable in:

- `MarketingLayout`
- `AuthLayout`
- `AppLayout` user/menu area
- `HomeFooter`

### Services and API Contracts

No production backend preference system is required. Demo/mock support can add `preferredLanguage` to register/current-user payloads, but the frontend should remain functional with only local storage.

### Migration Order

1. Add i18n foundation and language switcher.
2. Add docs and glossary.
3. Localize public/home/auth flows.
4. Localize chat and teacher escalation.
5. Localize parent/tutor/pricing/billing/support.
6. Localize P1 pages.
7. Add QA checks for AI terminology and language layout.

## Architecture Constraints

- Do not put translation strings directly in components after migration.
- Do not put translation files in backend/demo data.
- Do not localize by hardcoding conditional strings per language in JSX.
- Keep API URLs and API mode logic unchanged.
- Keep design-system and accessibility hardening for the next milestone unless layout fixes are required for multilingual text.
