# Phase 193: Local Quality Gate Verification and Targeted Smoke Checks - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated via autonomous execution

<domain>
## Phase Boundary

Validate the repaired workflow using commands that mirror CI and targeted smoke checks for the developer surfaces touched by Phase 191 and Phase 192.
</domain>

<decisions>
## Implementation Decisions

- Run the same core sequence as GitHub Actions when feasible: `npm ci`, `npm run lint`, and `npm run build`.
- Use the existing Playwright smoke suite as the targeted browser check because configuration changes touched Playwright/Node docs and local generated-file hygiene.
- Treat external environment failures separately from code failures if a command cannot run due to sandbox/network/browser runtime limitations.
</decisions>

<code_context>
## Existing Code Insights

- `npm ci --dry-run` already passed in Phase 192.
- `npm run lint` passed after the ESLint Node boundary fix.
- `npm run build` passed after the ESLint fix.
- `playwright.config.ts` is configured to start `npm run dev -- --host 127.0.0.1`.
</code_context>

<specifics>
## Specific Ideas

- Run full `npm ci` for install parity.
- Re-run lint and build after reinstall.
- Run `npm run test:e2e` if browser dependencies are available.
- Record outputs and residual risks in a verification summary.
</specifics>

<deferred>
## Deferred Ideas

- Adding Playwright to GitHub Actions remains deferred unless the current suite proves stable and cheap enough for every push.
</deferred>
