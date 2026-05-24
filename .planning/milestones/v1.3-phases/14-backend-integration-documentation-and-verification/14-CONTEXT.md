# Phase 14: Backend Integration Documentation and Verification - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Smart discuss, auto-accepted from roadmap and supplied Phase 4 brief

<domain>
## Phase Boundary

Document how to run and verify the Phase 4 backend-integrated chat frontend locally, including env variables, FastAPI CORS, endpoint contract, non-streaming response behavior, and backend-only Codex testing-provider strategy.

</domain>

<decisions>
## Implementation Decisions

### Documentation Scope
- README should include Phase 4 backend integration details.
- `.env.example` should include `VITE_API_BASE_URL=http://localhost:8000`.
- Document local frontend, backend, and FastAPI docs URLs.
- Document expected endpoints and non-streaming behavior.

### Provider Boundary
- State that frontend calls only STOA backend APIs.
- State that Codex is a backend-only testing provider during Phase 4.
- Do not add any frontend model provider keys or instructions.
- Keep future provider replacement transparent to frontend contract.

### Verification
- Run `npm install` if dependencies are stale or missing.
- Run `npm run build`.
- Run route verification for `/chat` when feasible.
- If backend is unavailable, record that browser checks can verify frontend fallback/error states but not real API success.

### the agent's Discretion
The agent may choose README section placement that best matches the existing document structure.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing README already documents earlier milestones.
- `.env.example` exists from v1.1.

### Established Patterns
- README uses concise setup sections and milestone notes.
- Env configuration uses Vite `VITE_` variables.

### Integration Points
- Documentation must match `src/services/api/httpClient.ts` environment variable naming.
- Verification should reflect actual command results.

</code_context>

<specifics>
## Specific Ideas

Use the exact endpoint list supplied in the Phase 4 brief.

</specifics>

<deferred>
## Deferred Ideas

Production deployment, streaming docs, upload docs, and real auth docs are deferred.

</deferred>
