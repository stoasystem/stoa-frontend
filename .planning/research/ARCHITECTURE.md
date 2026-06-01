# Research: v1.35 Architecture

## Current Integration Points

- `src/types/student.ts` defines `StudentProfile` without an answer-language field.
- `src/services/student/studentApi.ts` provides mock/demo fallback profile data and merges backend profile responses.
- `src/pages/profile/StudentProfilePage.tsx` edits grade, primary subjects, and school system through `useUpdateStudentProfileMutation`.
- `src/types/onboarding.ts` defines `StudentOnboardingProfile`; registration payload already has a top-level `preferredLanguage`.
- `backend/app/database.py` creates `student_profiles` without a preferred-language column.
- `backend/app/main.py` returns student profiles through `profile_response`, updates grade/school/subjects in `PATCH /students/me/profile`, and currently calls the Learning Assistant with `language="en"`.
- `demo-harness/harness/build_prompt.py` already includes `Response language: {prompt_input.language}`.
- `demo-harness/harness/providers/template_provider.py` has German, French, and Italian branches, but out-of-scope and some specialized branches still return English first.

## Proposed Data Flow

1. Student selects `preferredAnswerLanguage` in registration or profile.
2. Frontend validates the code against `supportedLanguages`.
3. Frontend sends the preference through existing `/auth/register` and `/students/me/profile` contracts.
4. Demo backend persists the value on `student_profiles`.
5. `GET /students/me/profile` returns the value for profile display/editing.
6. `POST /conversations/{id}/messages` loads the student profile and passes the saved language into `LearningAssistantRequest.language`.
7. Harness prompt and template fallback generate the answer in that language.

## Build Order

1. Establish typed contracts and frontend profile/onboarding UI.
2. Persist and expose the field in the demo backend.
3. Wire chat backend to pass the saved language into the Learning Assistant request.
4. Harden fallback behavior and tests for all supported languages.
5. Document the contract and verify profile-to-chat behavior.

## Compatibility

- Existing profiles without a stored language should default to English or the current browser UI language, but the backend should normalize to a supported code before calling the harness.
- Existing frontend UI language persistence with `stoa_language` should not be repurposed as the authoritative student profile preference once a profile value exists.

