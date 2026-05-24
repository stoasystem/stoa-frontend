# Testing Patterns

**Analysis Date:** 2026-05-24

## Test Framework

**Runner:**
- No test runner is currently installed.
- `package.json` has no `test`, `test:watch`, or `test:coverage` script.
- No `vitest.config.*`, `jest.config.*`, or `playwright.config.*` file exists.

**Assertion Library:**
- None configured.

**Run Commands:**
```bash
npm run build   # TypeScript build plus Vite production build
npm run lint    # ESLint over TS/TSX, but config is currently missing
```

## Test File Organization

**Location:**
- No test files exist.
- No `tests/`, `__tests__/`, or colocated `*.test.ts(x)` pattern is established.

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
- No E2E framework exists.
- Good future coverage: student ask flow, answer view, history, parent report, teacher queue/session, admin dashboard.

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

- `npm run build` is likely blocked until required Vite/TypeScript files such as `tsconfig*.json` and `index.html` are added.
- `npm run lint` is likely blocked until ESLint 9 flat config is added.
- There are no tests protecting the API client, auth store, route table, or future role-based access behavior.

---
*Testing analysis: 2026-05-24*
*Update when test patterns change*
