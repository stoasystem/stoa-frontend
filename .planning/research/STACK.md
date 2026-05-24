# Stack Research

**Domain:** Vite React staging deployment, QA, E2E testing, and early user feedback
**Researched:** 2026-05-25
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| GitHub Actions | hosted workflow, `actions/checkout@v4`, `actions/setup-node@v4` | CI build/lint gate on push and pull request | Matches the existing GitHub remote and supports npm cache through setup-node. |
| Node.js | 20 LTS in CI | Deterministic frontend CI runtime | Existing project recommends Node 20+ and GitHub setup-node supports explicit version pinning. |
| npm | existing package manager | Dependency install and scripts | Repository already uses `package-lock.json`; CI should use `npm ci`. |
| Vercel or Netlify | platform-managed static hosting | Staging frontend and preview deployments | Both are appropriate for Vite SPA MVP staging; Vercel has direct Vite SPA rewrite guidance, Netlify supports `_redirects`. |
| Playwright Test | latest `@playwright/test` | Browser E2E smoke tests | Official Playwright docs support local web server orchestration and CI execution. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` | latest npm release | E2E runner, browser automation, assertions | Add in Phase 8 for auth, student, parent, and tutor demo flows. |
| `httpx` | Python test dependency only if using FastAPI TestClient | Backend smoke-test helper | Keep as a local/dev dependency path if backend runtime tests are scripted. |
| Lighthouse CI | optional later | Performance baseline automation | Use docs/manual Lighthouse first; add CI automation only if baseline needs repeatability. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `vercel.json` | SPA rewrite fallback for Vercel | Use root-level rewrite to `index.html` for React Router refreshes. |
| `public/_redirects` | SPA fallback for Netlify | `/* /index.html 200` is the standard static SPA fallback shape. |
| `.github/workflows/frontend-ci.yml` | CI for install, lint, build, optional E2E | Keep first workflow small and reliable; add E2E after local tests stabilize. |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Structured bug reports | Markdown issue templates are enough for Phase 8; issue forms can come later. |

## Installation

```bash
npm install -D @playwright/test
npx playwright install
```

Add scripts:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GitHub Actions | Vercel/Netlify build checks only | Use platform checks alone only for very small projects; GitHub Actions gives repo-level protection independent of host. |
| Vercel or Netlify | S3 + CloudFront | Use AWS hosting when infrastructure parity matters more than MVP iteration speed. |
| Playwright | Cypress | Cypress is viable, but Playwright is framework-neutral, first-class in CI docs, and easy to run against local/staging URLs. |
| Markdown issue template | GitHub issue form YAML | Use issue forms once triage fields need enforced structured inputs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| CI that runs only on `main` pushes | Broken PRs can merge before checks run. | Run on both `push` and `pull_request` to `main`. |
| `npm install` in CI | Less deterministic than lockfile-based install. | `npm ci`. |
| Frontend secrets in `VITE_*` vars | Vite exposes `VITE_*` values to browser bundles. | Keep secrets in backend or deployment platform secret stores for backend only. |
| Full production deployment work in Phase 8 | Expands scope beyond staging trials. | Staging config, docs, QA, and readiness plan. |

## Stack Patterns by Variant

**If using Vercel staging:**
- Add `vercel.json` with SPA rewrites.
- Configure `VITE_API_BASE_URL`, `VITE_APP_ENV`, `VITE_ENABLE_DEMO_SHORTCUTS`, `VITE_ENABLE_ANALYTICS`, and `VITE_ENABLE_FEEDBACK` in Vercel project settings.

**If using Netlify staging:**
- Add `public/_redirects`.
- Configure build command `npm run build` and publish directory `dist`.

**If no hosted staging is available yet:**
- Document a manual preview path: `npm run build` then `npm run preview`.
- Treat this as a fallback, not final Phase 8 completion for real early users.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 19 + Vite 6 | Playwright Test latest | E2E interacts with served app, so app framework version has low coupling. |
| `actions/setup-node@v4` | Node 20 + npm cache | Uses lockfile hashing for npm cache when configured. |
| Vite SPA | Vercel/Netlify static deploy | Needs route fallback for React Router deep links. |

## Sources

- Vercel Vite docs: https://vercel.com/docs/frameworks/frontend/vite
- Vercel rewrites docs: https://vercel.com/docs/routing/rewrites
- Netlify redirects docs: https://docs.netlify.com/manage/routing/redirects/overview/
- GitHub `actions/setup-node` docs: https://github.com/actions/setup-node
- Playwright web server docs: https://playwright.dev/docs/test-webserver
- Playwright CI docs: https://playwright.dev/docs/ci
- Lighthouse CI configuration docs: https://googlechrome.github.io/lighthouse-ci/docs/configuration.html
- GitHub issue template docs: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests

---
*Stack research for: STOA Phase 8 staging and QA readiness*
*Researched: 2026-05-25*
