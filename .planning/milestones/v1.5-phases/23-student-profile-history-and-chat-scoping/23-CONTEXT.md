# Phase 23: Student Profile, History, and Chat Scoping - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated during `$gsd-autonomous`

## Phase Boundary

Add student profile and learning-history workflow while preserving current-user chat scoping.

## Decisions

- Use TanStack Query for student profile/history server state.
- Keep chat services authenticated through shared `httpClient` and streaming token injection.
- Student routes remain under the student role guard.
