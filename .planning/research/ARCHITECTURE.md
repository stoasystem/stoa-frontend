# Architecture Research

**Domain:** Staging deployment, CI, E2E, feedback, and QA architecture for a Vite SPA
**Researched:** 2026-05-25
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
Developer / PR
  -> GitHub Actions
     -> npm ci
     -> npm run lint
     -> npm run build
     -> optional npm run test:e2e

Staging Host
  -> static Vite build in dist/
  -> SPA fallback to index.html
  -> VITE_API_BASE_URL points to staging backend

Browser App
  -> React Router public/protected routes
  -> Feedback UI
  -> httpClient services
  -> staging backend APIs

Local/Staging Backend
  -> /feedback
  -> /analytics/events
  -> auth/chat/parent/tutor endpoints
  -> SQLite for local test data
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| CI workflow | Prevent obvious broken builds | `.github/workflows/frontend-ci.yml`. |
| SPA fallback config | Keep direct routes refreshable | `vercel.json` and/or `public/_redirects`. |
| Playwright config | Run local browser smoke tests | `playwright.config.ts` with `webServer`. |
| Feedback service | Submit early user feedback | `src/services/feedback/feedbackApi.ts` using `httpClient`. |
| Feedback UI | User-facing collection point | `FeedbackButton` + `FeedbackDialog` inside role layout. |
| Legal placeholders | Public testing notices | `/privacy` and `/terms` public routes. |
| Docs | Make staging and QA repeatable | `docs/deployment`, `docs/qa`, `docs/testing`, `docs/demo`, `docs/feedback`, `docs/security`. |

## Recommended Project Structure

```text
.github/
├── workflows/frontend-ci.yml
└── ISSUE_TEMPLATE/bug_report.md
docs/
├── deployment/staging.md
├── qa/manual-qa-checklist.md
├── testing/e2e.md
├── demo/mvp-demo-flow.md
├── feedback/feedback-workflow.md
└── security/frontend-security-review.md
tests/
└── e2e/
    ├── auth.spec.ts
    ├── student-chat.spec.ts
    ├── parent-dashboard.spec.ts
    └── tutor-workflow.spec.ts
src/
├── components/feedback/
├── hooks/feedback/
├── services/feedback/
└── pages/legal/
```

### Structure Rationale

- **`.github/`:** Keeps CI and issue template behavior close to GitHub repository features.
- **`docs/`:** Separates operational/test process docs from product README.
- **`tests/e2e/`:** Keeps browser tests independent of app source.
- **`src/components|hooks|services/feedback`:** Matches existing feature slice patterns for API-backed UI.
- **`src/pages/legal`:** Public static routes fit existing page routing conventions.

## Architectural Patterns

### Pattern 1: Environment-Gated UI

**What:** Show feedback or demo aids only when env flags allow them.
**When to use:** Feedback button, demo shortcuts, staging-only notices.
**Trade-offs:** Prevents accidental production exposure but requires env docs and defaults.

```typescript
export const enableFeedback = import.meta.env.VITE_ENABLE_FEEDBACK === 'true'
```

### Pattern 2: E2E Against Real App Boundary

**What:** Playwright starts the Vite server through `webServer` and exercises the browser app like a user.
**When to use:** Auth, chat, parent, tutor smoke tests.
**Trade-offs:** Higher confidence than unit tests, but needs deterministic local backend or route mocking.

### Pattern 3: Thin Feedback Contract

**What:** Frontend submits `{ type, page, message, userRole }` to `/feedback`.
**When to use:** Early user testing before support tooling exists.
**Trade-offs:** Quick to implement but requires a clear retrieval/triage process.

## Data Flow

### Feedback Flow

```text
User opens feedback dialog
  -> enters type/message
  -> FeedbackDialog reads current route and user role
  -> useSubmitFeedbackMutation
  -> feedbackApi.post('/feedback')
  -> backend writes feedback row
  -> toast success/error
```

### CI Flow

```text
push or pull_request
  -> checkout
  -> setup-node@v4 with npm cache
  -> npm ci
  -> npm run lint
  -> npm run build
  -> optional npm run test:e2e
```

### E2E Flow

```text
Playwright config webServer
  -> starts Vite app
  -> tests use demo accounts
  -> route assertions verify role-specific flows
  -> report surfaces failures locally/CI
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-50 early users | SQLite feedback, manual GitHub Issues triage, local/staging E2E smoke tests. |
| 50-500 users | Move feedback retrieval into admin/support tooling, add CI E2E against preview/staging, add uptime/error monitoring. |
| 500+ users | Production support workflow, privacy/legal workflow, analytics backend, monitoring alerts, database-backed reporting. |

### Scaling Priorities

1. **First bottleneck:** Feedback triage becomes manual noise; solve with issue labels or a small admin view.
2. **Second bottleneck:** E2E tests become flaky/slow; solve with smoke/full split and deterministic test data reset.

## Anti-Patterns

### Anti-Pattern 1: Staging Without Route Fallback

**What people do:** Deploy a Vite build and only test `/`.
**Why it's wrong:** Direct links and refreshes on `/chat`, `/parent`, or `/tutor/requests/:id` 404.
**Do this instead:** Add host-specific SPA fallback and test deep routes.

### Anti-Pattern 2: E2E Depends on Mutable Shared State

**What people do:** Tests assume previous seed state remains unchanged.
**Why it's wrong:** User testing and previous runs mutate conversations/help requests.
**Do this instead:** Document/reset demo data or make E2E selectors tolerate seeded baseline.

### Anti-Pattern 3: Feedback UI Without Triage Workflow

**What people do:** Add a form but no retrieval, severity, or issue process.
**Why it's wrong:** Feedback disappears and users lose trust.
**Do this instead:** Pair feedback endpoint with workflow docs and GitHub Issues template.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Actions | YAML workflow | Keep Node version and npm cache explicit. |
| Vercel/Netlify | Static build config | Build command `npm run build`, output `dist`, route fallback required. |
| Playwright | npm dev dependency + config | Use `webServer` for local app startup. |
| Lighthouse | Manual or LHCI | Start manual baseline; automate only after pages are stable. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Feedback UI -> feedback service | `submitFeedback` service function | Keep current route/role capture in UI, API client typed. |
| Feedback service -> backend | `POST /feedback` | Backend enforces auth if token exists but can optionally accept anonymous test-stage feedback. |
| Legal pages -> router | Public routes | Must not require auth. |
| E2E -> app/backend | Browser UI + local API | Prefer seeded demo accounts. |

## Sources

- Playwright web server docs: https://playwright.dev/docs/test-webserver
- Playwright CI docs: https://playwright.dev/docs/ci
- Vercel Vite docs: https://vercel.com/docs/frameworks/frontend/vite
- Netlify redirects docs: https://docs.netlify.com/manage/routing/redirects/overview/
- GitHub setup-node docs: https://github.com/actions/setup-node
- Lighthouse CI configuration docs: https://googlechrome.github.io/lighthouse-ci/docs/configuration.html

---
*Architecture research for: STOA Phase 8 staging and QA*
*Researched: 2026-05-25*
