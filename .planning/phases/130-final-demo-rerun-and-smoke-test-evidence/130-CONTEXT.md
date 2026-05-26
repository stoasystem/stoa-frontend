# Phase 130: Final Demo Rerun and Smoke Test Evidence - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 130 reruns the public demo candidate and records final smoke evidence. It verifies demo reset, backend health, demo accounts, core role flows, multilingual routes, responsive layouts, accessibility smoke checks, and build status. It does not add features or change release scope.

</domain>

<decisions>
## Implementation Decisions

### Final Run Scope
- Use direct demo backend API smoke for cross-role workflow proof.
- Use Playwright browser smoke for route rendering, locale switching, responsive layout, image health, and basic accessibility checks.
- Record exact limitations instead of expanding Phase 23.
- Treat Phase 132 as the final Go / No-Go gate; Phase 130 only decides whether to proceed to handoff docs.

### Evidence Requirements
- Record date, commit hash, environment, tester, browser, device widths, language coverage, flow result, issues found, and interim Go / No-Go.
- Include demo account login evidence.
- Include build evidence.
- Include exact non-blocking limitations carried forward.

### the agent's Discretion
The agent may use scripted API and Playwright smoke checks as final-run evidence when they directly cover the Phase 23 required flows and pages.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/demo/final-demo-run-result.md` contains the Phase 22 LC1 final run format.
- `docs/demo/final-demo-package/demo-accounts.md` contains locked demo accounts.
- Backend scripts `npm run demo:reset` and `npm run demo:backend` are available.
- Protected routes can be smoke-tested with `stoa_access_token` from demo login.

### Established Patterns
- Final run evidence is stored as Markdown under `docs/release/` or `docs/demo/`.
- API smoke validates backend contract; browser smoke validates user-facing routes.

### Integration Points
- Phase 131 handoff docs must reference this final run evidence.
- Phase 132 final Go / No-Go must consume this document.

</code_context>

<specifics>
## Specific Ideas

Run homepage, register, chat, parent report, pricing, contact/footer in EN/DE/FR/IT, plus responsive widths 375px, 430px, 768px, 1024px, and 1440px.

</specifics>

<deferred>
## Deferred Ideas

Manual cross-browser/device and manual screen-reader checks remain non-blocking limitations unless stakeholders require them before public demo release.

</deferred>
