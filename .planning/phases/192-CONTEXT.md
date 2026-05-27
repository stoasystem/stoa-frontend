# Phase 192: Tooling, Script, and Workflow Drift Audit - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated via autonomous execution

<domain>
## Phase Boundary

Audit the current frontend toolchain for configuration drift that could produce repeat CI failures or local/CI mismatch.
</domain>

<decisions>
## Implementation Decisions

- Fix only low-risk drift directly connected to CI/local workflow reliability.
- Avoid adding dependencies unless the existing toolchain cannot express the needed configuration.
- Document risky or broad follow-ups instead of folding them into this milestone.
</decisions>

<code_context>
## Existing Code Insights

- CI runs on Node 20 and uses `npm ci`, `npm run lint`, and `npm run build`.
- Local runtime is Node 26.0.0, so Node-version-sensitive behavior should be considered.
- `.gitignore` already excludes `node_modules/`, `dist/`, local env files, Playwright report directories, backend local DB/venv/uploads, and demo harness logs.
- `package-lock.json` exists, enabling `npm ci` parity.
</code_context>

<specifics>
## Specific Ideas

- Compare `package.json` scripts to `.github/workflows/frontend-ci.yml`.
- Check lockfile/package manifest consistency with npm dry-run install parity.
- Inspect TypeScript, Vite, Playwright, ESLint, and npm wrapper scripts for environment assumptions.
- Check untracked/ignored generated files after build and install verification.
</specifics>

<deferred>
## Deferred Ideas

- Full CI matrix expansion, backend harness CI, and Playwright report publishing are future automation work unless a direct blocker appears.
</deferred>
