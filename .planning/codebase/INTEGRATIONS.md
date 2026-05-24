# External Integrations

**Analysis Date:** 2026-05-24

## APIs & External Services

**Backend API:**
- Integration method: Axios client exported from `src/lib/api.ts`.
- Base URL: `import.meta.env.VITE_API_URL || '/api'`.
- Local development proxy: `/api` is proxied to `http://localhost:8000` in `vite.config.ts`, with the `/api` prefix stripped.
- Auth: `Authorization: Bearer <Cognito access token>` is injected when `fetchAuthSession()` returns an access token.
- Current usage: no page currently imports the API client; it is infrastructure waiting for feature implementation.

## Data Storage

**Databases:**
- No direct database client exists in this frontend.
- Persistent application data is expected to live behind the backend API.

**File Storage:**
- No upload or storage SDK is present in the frontend.
- `src/stores/questionStore.ts` tracks a `pendingImageKey`, which implies image upload/storage will exist elsewhere, likely through the backend.

**Caching:**
- TanStack Query is configured globally in `src/main.tsx`.
- Default query behavior: `retry: 1`, `staleTime: 30_000`.
- No query keys, mutations, or query hooks are implemented yet.

## Authentication & Identity

**Auth Provider:**
- Amazon Cognito via AWS Amplify.
- Configuration lives in `src/lib/amplify.ts`.
- Required env vars:
  - `VITE_COGNITO_USER_POOL_ID`
  - `VITE_COGNITO_CLIENT_ID`
- Login method configured as email login (`loginWith: { email: true }`).

**Session Handling:**
- `src/main.tsx` calls `Amplify.configure(amplifyConfig)` before rendering the app.
- `src/lib/api.ts` uses `fetchAuthSession()` on each outgoing API request.
- A 401 API response dynamically imports `signOut` from `aws-amplify/auth`, signs out, and redirects to `/login`.

**Client Auth State:**
- `src/stores/authStore.ts` stores `user`, `email`, `role`, and `subscriptionTier`.
- The store is currently not hydrated from Cognito or the backend.
- `src/App.tsx` reads `user` but does not enforce route guards.

## Monitoring & Observability

**Error Tracking:**
- No error tracking integration is configured.

**Analytics:**
- No analytics package or event tracking exists.

**Logs:**
- No logging framework exists.
- No console logging was found in `src/`.

## CI/CD & Deployment

**Hosting:**
- Deployment platform is not defined.
- The app is structured as a Vite static frontend once build prerequisites are completed.

**CI Pipeline:**
- No `.github/workflows`, CI config, or deployment config exists in the current repo.

## Environment Configuration

**Development:**
- Required env vars are documented in `README.md`.
- Secrets and local env files are ignored in `.gitignore`.
- Local backend proxy assumes an API server on `http://localhost:8000`.

**Staging:**
- No staging-specific configuration exists.

**Production:**
- No production environment documentation exists.
- Production requires hosted static assets, API base URL, and Cognito client configuration.

## Webhooks & Callbacks

**Incoming:**
- None in this frontend.

**Outgoing:**
- Browser-origin API requests through `src/lib/api.ts`.
- No webhook callbacks or third-party browser callbacks are implemented.

---
*Integration audit: 2026-05-24*
*Update when adding/removing external services*
