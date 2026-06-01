# Phase 196 Plan

## Goal

The local/demo backend persists the answer-language preference and exposes it through registration and student profile endpoints.

## Tasks

1. Add SQLite compatibility.
   - Add `preferred_language` to `student_profiles` schema.
   - Add startup-time column migration for existing local databases.
   - Seed default student with `en`.

2. Add backend validation and normalization.
   - Define supported codes: `en`, `de`, `fr`, `it`.
   - Normalize missing values to `en`.
   - Reject unsupported PATCH values.

3. Update profile contracts.
   - Return `preferredAnswerLanguage` in profile responses.
   - Accept `preferredAnswerLanguage` in `PATCH /students/me/profile`.
   - Persist student registration value from profile/top-level language.

## Verification

- Backend syntax check in Phase 198.
- Backend smoke checks in Phase 198.

