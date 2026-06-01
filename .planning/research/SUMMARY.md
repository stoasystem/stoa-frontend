# Research Summary: v1.35 Student Language Preference

## Stack Additions

No new dependencies are needed. The milestone should reuse existing React/TypeScript forms, i18next supported-language metadata, TanStack Query profile hooks, the local FastAPI demo backend, SQLite demo persistence, and the existing Python Learning Assistant harness.

## Feature Table Stakes

- Student profile and onboarding capture a supported answer-language preference.
- Demo backend stores and returns the preference on registration, profile read, and profile update.
- Chat message generation uses the saved student profile language instead of hard-coded English.
- Prompt construction, template fallback, response checks, and tests verify English, German, French, and Italian answer behavior.
- Documentation and copy explicitly separate interface language from Learning Assistant answer language.

## Watch Out For

- Do not rely on browser UI language as the only source of truth.
- Do not leave `language="en"` in the backend chat generation path.
- Do not let unsupported language codes flow into prompts.
- Do not add translation services, production provider orchestration, or formal backend/database architecture in this frontend milestone.
- Do not expose provider, prompt, backend, demo, or mock terminology in user-facing profile or chat copy.

