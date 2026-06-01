# Phase 209 Plan: Question Bank Upload Entry Points and Session Handoff

## Goal

Let students bring their own Question Bank material or current-session work into Learning Chat while preserving the existing Question Bank answer flow.

## Scope

- Add a secondary upload CTA to Question Bank home.
- Add an upload modal with preview, validation, remove, retry, and completion states.
- Add a compact upload panel to question sessions.
- Save lightweight upload handoff metadata through route state and session storage fallback.
- Render upload context in Chat.

## Acceptance

- Question Bank home upload opens a modal and can hand off to Chat.
- Question Session upload includes session ID, question ID, and attachment metadata.
- Answer input, feedback, and navigation remain unaffected.
