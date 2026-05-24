# Research: Pitfalls for v1.3 Backend Chat Integration

**Date:** 2026-05-24
**Milestone:** v1.3 Phase 4 Backend Integration and Real Chat API

## Pitfalls

| Pitfall | Prevention |
|---------|------------|
| Components become coupled to backend wire quirks | Keep API response shapes typed and normalized in services/types before rendering. |
| Query keys diverge across hooks | Use `chatQueryKeys` everywhere. |
| Send mutation succeeds but UI remains stale | Invalidate both active conversation detail and conversation list after success. |
| Disabled queries accidentally fetch with null IDs | Gate conversation detail query with `enabled: Boolean(conversationId)`. |
| Frontend leaks AI provider assumptions | README and code should state that Codex/testing provider is backend-only. |
| CORS errors are mistaken for normal API errors | Document `http://localhost:5173` as an allowed FastAPI origin. |
| Env names drift between docs and code | Standardize on `VITE_API_BASE_URL`; optionally preserve existing fallback compatibility if the code currently uses another name. |
| Full optimistic UI adds complexity too early | Use pending disabled input plus assistant thinking, then invalidate and refetch on success. |
| Empty conversation list blocks future create flow | Phase 4 should show empty state; full create-new-conversation UX can be Phase 5 unless minimal creation is explicitly required. |

## Watch List

- Confirm backend uses camelCase fields or add API-layer mapping.
- Confirm send-message synchronously returns both `studentMessage` and `assistantMessage`.
- Confirm teacher-help endpoint exists or returns a stable placeholder response.
- Confirm auth header expectations before enforcing protected routes.
