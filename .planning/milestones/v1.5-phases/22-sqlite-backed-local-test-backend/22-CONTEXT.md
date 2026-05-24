# Phase 22: SQLite-Backed Local Test Backend - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated during `$gsd-autonomous`

## Phase Boundary

Provide a local FastAPI + SQLite backend that exercises Phase 6 contracts and data permission boundaries.

## Decisions

- Keep SQLite behind HTTP APIs; frontend never reads `local.db`.
- Use standard-library SQLite access for the local test service.
- Keep seed runnable without FastAPI installed.
- Use local PBKDF2 password hashing and HMAC-signed bearer tokens for local testing.

## Verification Target

Seed must create `local.db`, required tables, and four role accounts.
