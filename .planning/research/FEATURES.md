# Research: v1.35 Features

## Feature Categories

### Student Profile Preference

**Table stakes:**
- Student profile includes a clear answer-language field.
- The field uses the same supported language set as the UI: English, German, French, Italian.
- The field is editable with the rest of learning context and shown in profile summary.

**Differentiators:**
- Copy explains that this controls Learning Assistant answers, not necessarily the whole interface.
- The initial value can default from current UI language or saved user preference when no profile preference exists.

### Registration and API Contract

**Table stakes:**
- Student onboarding can submit answer-language preference.
- Demo backend stores and returns the field on registration, profile read, and profile update.
- Mock/demo fallback profile includes a stable default value.

**Differentiators:**
- Contract names should avoid provider-specific language and remain future-backend friendly.
- Validation should reject unsupported language codes before the value reaches prompt construction.

### Learning Assistant Response Language

**Table stakes:**
- Chat message generation uses the saved student profile language instead of hard-coded English.
- Prompt construction explicitly includes the selected response language.
- Template fallback returns guided, non-answer-first responses in the requested language.

**Differentiators:**
- Tests cover all four languages through the same request path where practical.
- Out-of-scope and teacher-escalation fallback messages should respect the requested language too.

### QA and Documentation

**Table stakes:**
- Requirements and docs distinguish interface language from Learning Assistant answer language.
- Regression tests verify backend/harness propagation.
- Build/lint and targeted browser smoke checks cover the profile flow.

**Differentiators:**
- Demo notes can explain how reviewers should verify a German/French/Italian answer while keeping the UI in another language.

## Deferred

- Cross-device production preference syncing.
- New supported languages beyond English, German, French, and Italian.
- Automatic translation of historical conversations.
- Parent-managed language preference for a child account.

