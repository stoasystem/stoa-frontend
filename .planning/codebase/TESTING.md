# Testing Patterns

**Analysis Date:** 2026-05-24

## Test Framework

**Runner:**
- Playwright is installed for browser E2E checks through `@playwright/test`.
- `package.json` has `test:e2e` and `test:e2e:ui` scripts.
- No unit test runner, `test`, `test:watch`, or `test:coverage` script is currently configured.
- `playwright.config.ts` exists and starts the Vite dev server for E2E checks.

**Assertion Library:**
- None configured.

**Run Commands:**
```bash
npm run build   # TypeScript build plus Vite production build
npm run lint    # ESLint flat config over repository source and config files
npm run test:e2e # Playwright E2E checks
```

## Test File Organization

**Location:**
- E2E tests live under `tests/e2e/`.
- No colocated unit test pattern is established.

**Naming:**
- Not established.

**Structure:**
```
src/
  App.tsx
  main.tsx
  lib/
    api.ts
    amplify.ts
  stores/
    authStore.ts
    questionStore.ts
  pages/
    ...
```

## Test Structure

**Suite Organization:**
```typescript
// No existing test style to copy yet.
// A future Vitest + React Testing Library setup would likely use:
describe('ComponentName', () => {
  it('renders expected state', () => {
    // render, interact, assert
  })
})
```

**Patterns:**
- No setup, teardown, fixture, or mock conventions are established.
- No browser/E2E testing pattern is established.

## Mocking

**Framework:**
- None configured.

**Patterns:**
```typescript
// No existing mocks.
// Future API tests should mock `src/lib/api.ts` or network calls.
// Future auth tests should mock `aws-amplify/auth`.
```

**What to Mock:**
- Cognito session APIs from `aws-amplify/auth`.
- Backend calls through the Axios client.
- Browser navigation side effects such as `window.location.href` in auth failure tests.

**What NOT to Mock:**
- Pure route rendering once route guards and components exist.
- Zustand store behavior unless the test specifically needs isolated state.

## Fixtures and Factories

**Test Data:**
```typescript
// No fixtures exist.
// A future user factory should match `User` in `src/stores/authStore.ts`:
const studentUser = {
  userId: 'student-1',
  email: 'student@example.com',
  role: 'student',
  subscriptionTier: 'standard',
}
```

**Location:**
- Not established.

## Coverage

**Requirements:**
- No coverage target exists.
- No CI gate exists.

**Configuration:**
- None.

**View Coverage:**
```bash
# Not available yet.
```

## Test Types

**Unit Tests:**
- Good initial targets:
  - `src/lib/api.ts` request interceptor attaches Cognito access tokens.
  - `src/lib/api.ts` 401 interceptor signs out and redirects.
  - Zustand stores set and clear state.

**Integration Tests:**
- Good initial targets once pages are implemented:
  - Route rendering through `src/App.tsx`.
  - Role guard behavior if added.
  - Query loading/error/success states for API-backed pages.

**E2E Tests:**
- Playwright is configured through `playwright.config.ts`.
- Current E2E coverage should focus on smoke-level route and demo-flow confidence because product data often depends on mock/demo API configuration.

## Common Patterns

**Async Testing:**
```typescript
// Not established.
// Future tests around Axios interceptors and React Query should use async/await.
```

**Error Testing:**
```typescript
// Not established.
// Future API tests should assert 401 behavior and non-401 error propagation.
```

**Snapshot Testing:**
- Not used.

## Current Verification Gaps

- `npm run build` is expected to pass with the checked-in Vite/TypeScript scaffold.
- `npm run lint` is expected to pass with the checked-in ESLint 9 flat config.
- Unit tests are still not configured for the API client, auth store, route table, or role-based access behavior.
- Browser E2E coverage exists, but it should remain targeted to stable smoke flows unless the backend/demo state is controlled.

---
*Testing analysis: 2026-05-24*
*Last updated: 2026-05-27 after Phase 36 tooling audit*
