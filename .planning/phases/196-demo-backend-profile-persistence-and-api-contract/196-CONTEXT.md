# Phase 196: Demo Backend Profile Persistence and API Contract - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

The local/demo backend persists the answer-language preference and exposes it through stable student profile and registration contracts.
</domain>

<decisions>
## Implementation Decisions

### Persistence

Store `preferred_language` on the existing `student_profiles` table. Return it to the frontend as `preferredAnswerLanguage`.

### Compatibility

Because `CREATE TABLE IF NOT EXISTS` does not add columns to an existing SQLite database, add a safe schema compatibility helper that runs on startup and adds the column when missing.

### Validation

Normalize all unsupported or missing values to `en`. Reject unsupported values on profile update with a validation error.
</decisions>

<code_context>
## Existing Code Insights

- `backend/app/database.py` owns local SQLite table creation.
- `backend/app/main.py` owns register, profile response, profile update, and chat request handling.
- `backend/app/seed.py` inserts the default student profile.
</code_context>

<specifics>
## Specific Ideas

- Add constants for supported language codes in backend main.
- Use `profile.preferredAnswerLanguage` first during registration, then fall back to top-level `preferredLanguage`.
- Keep parent-created child profiles on a safe default.
</specifics>

<deferred>
## Deferred Ideas

- Formal production migrations.
- Cross-device production preference sync.
</deferred>

