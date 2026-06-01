# Research: v1.35 Stack

## Scope

Milestone v1.35 adds student-level Learning Assistant answer-language preference for the existing supported languages: English, German, French, and Italian.

## Existing Stack Fit

- React, TypeScript, Vite, TanStack Query, and existing service/query hooks are sufficient for the student profile UI and API contract changes.
- The existing i18n layer already defines supported language codes in `src/i18n/languages.ts` and should be reused for frontend type safety and labels.
- The local FastAPI demo backend already owns `/auth/register`, `/students/me/profile`, and chat message generation, so answer-language persistence can stay behind STOA API boundaries.
- The Python demo harness already has `PromptInput.language`, `ProviderRequest.language`, and template fallback branches for `de`, `fr`, and `it`.

## Required Additions

- Add a typed student profile answer-language field to frontend contracts and local demo backend responses.
- Add a SQLite demo-backend column or compatible persistence path for `student_profiles.preferred_language`.
- Add frontend form controls using existing UI primitives and supported language metadata.
- Add validation that accepts only `en`, `de`, `fr`, and `it`.
- Add focused Python behavior tests for preferred-language propagation and template fallback output.

## What Not To Add

- No new language runtime, translation provider, or automatic translation service.
- No direct frontend model-provider calls.
- No production database migration system inside the frontend repo.
- No new localization framework; continue using the existing i18next setup.

