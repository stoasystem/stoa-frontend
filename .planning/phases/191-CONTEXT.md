# Phase 191: CI Failure Reproduction and ESLint Environment Fix - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated via autonomous execution

<domain>
## Phase Boundary

Fix the reported `Frontend CI / build` failure by reproducing the local lint failure and correcting the ESLint environment boundary for repository files that execute under Node.
</domain>

<decisions>
## Implementation Decisions

- Keep the browser source lint gate intact.
- Prefer ESLint flat-config environment targeting over inline `eslint-disable` comments.
- Cover Node scripts and root config files together because `scripts/vite.mjs`, `vite.config.ts`, and `playwright.config.ts` all execute in Node contexts.
</decisions>

<code_context>
## Existing Code Insights

- `.github/workflows/frontend-ci.yml` runs `npm ci`, `npm run lint`, and `npm run build` on Node 20.
- `npm run lint` currently fails on `scripts/vite.mjs` with `process is not defined`.
- `eslint.config.js` applies recommended JS/TS rules but does not declare Node globals for `.mjs` scripts or config files.
- `npm run build` already passes locally before the lint fix.
</code_context>

<specifics>
## Specific Ideas

- Add an ESLint config block for Node-executed repository files.
- Include `process`, `__dirname`, `module`, and other standard Node globals as readonly where appropriate.
- Re-run `npm run lint` and `npm run build`.
</specifics>

<deferred>
## Deferred Ideas

- Broader CI artifact publishing and full browser smoke matrix belong to future automation work unless this milestone finds a direct blocker.
</deferred>
