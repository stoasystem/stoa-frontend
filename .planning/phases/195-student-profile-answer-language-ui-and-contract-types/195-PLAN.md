# Phase 195 Plan

## Goal

Students can see, choose, and update the Learning Assistant answer language from supported frontend profile/onboarding surfaces.

## Tasks

1. Extend frontend types and validation.
   - Add `preferredAnswerLanguage` to `StudentProfile`.
   - Add `preferredAnswerLanguage` to `StudentOnboardingProfile`.
   - Validate profile updates against the supported language enum.

2. Update registration onboarding.
   - Default student answer language from current UI language when supported.
   - Render a labeled select in `StudentProfileStep`.
   - Add localized registration labels/help copy.

3. Update student profile page.
   - Display saved answer language in profile summary.
   - Render editable answer-language select in learning context.
   - Include value in `updateStudentProfile` payload.

4. Keep API fallback data coherent.
   - Add `preferredAnswerLanguage` to the mock student profile.
   - Ensure merge fallback returns a safe value.

## Verification

- TypeScript compilation via later milestone build.
- Browser smoke in Phase 198.
- Source scan for high-risk internal terms in new visible copy.

