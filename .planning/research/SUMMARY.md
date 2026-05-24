# Research Summary: v1.3 Backend Chat Integration

**Date:** 2026-05-24
**Milestone:** v1.3 Phase 4 Backend Integration and Real Chat API

## Stack Additions

No new frontend dependency is required. The milestone should use the existing React, TypeScript, Vite, Axios, and TanStack Query stack.

## Feature Table Stakes

- Typed chat API contract.
- Backend-driven conversation list and detail.
- Send-message mutation with query invalidation.
- Teacher-help mutation.
- Loading, error, empty, pending, and basic operation feedback states.
- Local FastAPI/CORS/env documentation.
- Codex testing provider documented as backend-only.

## Watch Out For

- Do not expose provider-specific model calls or configuration to the frontend.
- Do not implement streaming, WebSocket, real upload, auth enforcement, or dashboard backend APIs in this milestone.
- Use centralized query keys and invalidation to keep the UI fresh after mutations.
- Keep CORS and `VITE_API_BASE_URL` setup explicit in README and `.env.example`.

## Source Notes

- TanStack Query supports targeted invalidation and mutation-success invalidation patterns for refreshing stale server state.
- Vite exposes only `VITE_`-prefixed env variables to client code and warns that exposed values are bundled into frontend source.
- Axios custom instances support request and response interceptors for centralized request/error handling.
- FastAPI treats different localhost ports as different origins and requires explicit CORS configuration for browser frontend requests.
