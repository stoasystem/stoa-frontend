# Quick Task: Remove Login Review Shortcuts

**Created:** 2026-05-27
**Status:** In Progress

## Request

Remove the "Use saved review account" shortcut block from the login page because it is redundant.

## Plan

- Remove the shortcut block and fill helper from `LoginForm`.
- Keep normal email/password login unchanged.
- Run lint/build and verify the login page no longer renders the shortcut block.
