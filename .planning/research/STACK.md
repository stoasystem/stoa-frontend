# Research: Stack for v1.3 Backend Chat Integration

**Date:** 2026-05-24
**Milestone:** v1.3 Phase 4 Backend Integration and Real Chat API

## Existing Stack

- React 19, TypeScript, Vite, npm.
- Axios HTTP client at `src/services/api/httpClient.ts`.
- TanStack Query provider already configured.
- Chat UI is currently mock-driven through `useMockChat`.
- FastAPI backend is expected locally at `http://localhost:8000`.

## Stack Findings

- No new frontend runtime dependency is required for Phase 4.
- TanStack Query should own chat server state through `useQuery` and `useMutation`.
- Query keys should be centralized to avoid cache drift across list/detail/mutation invalidation.
- Axios should remain the only HTTP transport and should expose normalized errors through the existing service layer.
- Vite frontend environment variables must use the `VITE_` prefix; `VITE_API_BASE_URL=http://localhost:8000` is appropriate for local development.
- FastAPI must explicitly allow the frontend origin `http://localhost:5173` during local CORS setup.

## Sources

- TanStack Query docs: query invalidation and mutation invalidation support targeted cache invalidation after successful mutations.
- Vite docs: only `VITE_`-prefixed variables are exposed to client code, and local env files such as `.env.local` are intended for ignored local configuration.
- Axios docs: request/response interceptors can be attached to custom instances and can reject normalized errors.
- FastAPI docs: different localhost ports are different origins; `CORSMiddleware` should list allowed origins and headers/methods explicitly.

## Recommendation

Use the current stack without adding libraries:

- Add typed chat API functions under `src/services/chat/`.
- Add `chatQueryKeys`.
- Add chat query/mutation hooks under `src/hooks/chat/`.
- Keep UI feedback local to `ChatPage` for this milestone instead of adding toast infrastructure.
