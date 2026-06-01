# Research: v1.35 Pitfalls

## Pitfall: Confusing UI Language and Answer Language

If the implementation only reads `i18n.language`, a student using an English UI might be unable to receive German Learning Assistant answers. Keep browser UI language and student answer language separate in naming, copy, and contracts.

## Pitfall: Hard-Coded Backend Language

`backend/app/main.py` currently passes `language="en"` into `LearningAssistantRequest`. Updating only frontend profile UI would not change generated answers. The backend chat send path must load and pass the saved profile preference.

## Pitfall: Partial Fallback Localization

The template provider has language branches, but some high-priority branches such as out-of-scope, cheating/direct-answer, repeated confusion, equations, and physics may still return English. Tests should cover fallback responses beyond the generic branch.

## Pitfall: Unsupported Language Codes

Free-form strings can leak into prompts or produce inconsistent provider behavior. Normalize and validate against `en`, `de`, `fr`, and `it` at both frontend and backend/demo-harness boundaries.

## Pitfall: Demo Schema Drift

SQLite `CREATE TABLE IF NOT EXISTS` will not add columns to an existing local database automatically. The demo backend should include a safe compatibility path for existing `local.db` files, or docs should require reset when the profile schema changes.

## Pitfall: User-Facing Technical Terms

Visible copy should say Learning Assistant answer language, response language, or explanation language. Avoid exposing model, provider, prompt, backend, demo, or mock terminology in UI.

