# Phase 195: Student Profile Answer-Language UI and Contract Types - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Students can see, choose, and update the Learning Assistant answer language from the supported language set in frontend profile/onboarding surfaces.
</domain>

<decisions>
## Implementation Decisions

### Answer-language field naming

Use `preferredAnswerLanguage` for student profile and onboarding contracts. This keeps the setting distinct from the existing browser/interface language and top-level registration `preferredLanguage`.

### Supported options

Reuse the existing `SupportedLanguage` and `languageOptions` from `src/i18n/languages.ts`: English, German, French, and Italian.
</decisions>

<code_context>
## Existing Code Insights

- `src/types/student.ts` defines `StudentProfile`.
- `src/types/onboarding.ts` defines `StudentOnboardingProfile`.
- `src/components/auth/RegisterForm.tsx` builds the registration profile payload.
- `src/components/auth/StudentProfileStep.tsx` renders student onboarding fields.
- `src/pages/profile/StudentProfilePage.tsx` edits the student learning context.
- `src/lib/validation.ts` validates student profile updates.
</code_context>

<specifics>
## Specific Ideas

- Add a native select styled like other app selects.
- Add clear helper copy that says the language controls Learning Assistant explanations.
- Default onboarding to the current UI language when it is one of the supported languages.
</specifics>

<deferred>
## Deferred Ideas

- Parent-managed child answer language.
- New supported languages beyond the existing four-language product surface.
- Cross-device production preference syncing.
</deferred>

