# Architecture

**Analysis Date:** 2026-05-24

## Pattern Overview

**Overall:** Client-side React SPA shell for a role-based education platform.

**Key Characteristics:**
- Browser-rendered Vite app with React Router route definitions.
- Role areas are separated by URL prefix: student, parent, teacher, and admin.
- AWS Amplify is configured globally for Cognito auth.
- Axios API client centralizes token injection and 401 sign-out behavior.
- Most user-facing pages are placeholders; core domain workflows are not implemented yet.

## Layers

**Bootstrap Layer:**
- Purpose: Configure global providers and render the app.
- Contains: React root creation, BrowserRouter, QueryClientProvider, Amplify setup.
- Location: `src/main.tsx`.
- Depends on: `@tanstack/react-query`, `react-router-dom`, `aws-amplify`, `src/lib/amplify.ts`.
- Used by: Browser entry point.

**Routing Layer:**
- Purpose: Map URL paths to role-specific pages.
- Contains: Route table and default redirect.
- Location: `src/App.tsx`.
- Depends on: route components under `src/pages/**`.
- Used by: `src/main.tsx`.

**Page Layer:**
- Purpose: Represent role-specific screens.
- Contains: React components under `src/pages/student`, `src/pages/parent`, `src/pages/teacher`, and `src/pages/admin`.
- Depends on: currently no shared UI or API modules; each page returns placeholder content.
- Used by: `src/App.tsx` routes.

**Client Services Layer:**
- Purpose: Configure API and auth clients.
- Contains: `src/lib/api.ts` and `src/lib/amplify.ts`.
- Depends on: Axios and AWS Amplify auth APIs.
- Used by: future feature pages and hooks.

**Client State Layer:**
- Purpose: Hold lightweight global browser state.
- Contains: Zustand stores in `src/stores/authStore.ts` and `src/stores/questionStore.ts`.
- Depends on: `zustand`.
- Used by: `src/App.tsx` currently reads auth state; question store is not yet used.

## Data Flow

**Application Startup:**

1. Browser loads the Vite app entry.
2. `src/main.tsx` configures Amplify with env-derived Cognito settings.
3. A `QueryClient` is created with one retry and 30-second stale time.
4. React renders `App` inside `QueryClientProvider` and `BrowserRouter`.
5. `src/App.tsx` matches the current path and renders the corresponding page component.

**Protected API Request (intended flow):**

1. Feature code imports the Axios instance from `src/lib/api.ts`.
2. The request interceptor calls `fetchAuthSession()`.
3. If Cognito returns an access token, the client sets `Authorization: Bearer <token>`.
4. Axios sends the request to `VITE_API_URL` or `/api`.
5. If the backend responds with 401, the response interceptor signs out and redirects the browser to `/login`.

**Routing Flow:**

1. `/` redirects to `/student`.
2. `/student`, `/student/ask`, `/student/answer/:id`, and `/student/history` render student pages.
3. `/parent` and `/parent/report/:week` render parent pages.
4. `/teacher/queue` and `/teacher/session/:id` render teacher pages.
5. `/admin` renders the admin page.

**State Management:**
- Server state is intended to flow through TanStack Query, but no queries exist yet.
- Auth state is manually set through `useAuthStore`; no hydration path is implemented yet.
- Question image handoff state is stored as `pendingImageKey` in `useQuestionStore`.

## Key Abstractions

**Role Page:**
- Purpose: One route component per major role workflow.
- Examples: `src/pages/student/Ask.tsx`, `src/pages/teacher/Queue.tsx`, `src/pages/admin/Dashboard.tsx`.
- Pattern: Default-exported function component.

**API Client:**
- Purpose: Centralize backend URL, timeout, JWT injection, and auth failure handling.
- Example: `src/lib/api.ts`.
- Pattern: Axios singleton instance.

**Auth Store:**
- Purpose: Keep current user identity, role, and subscription tier available to UI.
- Example: `src/stores/authStore.ts`.
- Pattern: Zustand store with `user` and `setUser`.

**Amplify Config:**
- Purpose: Isolate Cognito environment mapping.
- Example: `src/lib/amplify.ts`.
- Pattern: exported configuration object consumed during app bootstrap.

## Entry Points

**React App Entry:**
- Location: `src/main.tsx`.
- Triggers: Browser loads the Vite bundle.
- Responsibilities: Configure Amplify, create QueryClient, mount React providers and routes.

**Route Table:**
- Location: `src/App.tsx`.
- Triggers: Browser navigation through React Router.
- Responsibilities: Route selection and default redirect.

**API Boundary:**
- Location: `src/lib/api.ts`.
- Triggers: Any future API call through the exported Axios instance.
- Responsibilities: Base URL selection, timeout, auth header injection, 401 sign-out.

## Error Handling

**Strategy:** Minimal client-boundary handling exists only in the API client.

**Patterns:**
- API request interceptor ignores `fetchAuthSession()` failures and lets requests proceed as unauthenticated.
- API response interceptor handles HTTP 401 globally by signing out and redirecting to `/login`.
- Feature-level error rendering is not implemented.
- No React error boundary exists.

## Cross-Cutting Concerns

**Logging:**
- No logging framework or app-level logging conventions exist.

**Validation:**
- No schema validation library or form validation layer is present.

**Authentication:**
- Cognito is configured through Amplify.
- No route guards currently enforce role or login checks.
- `src/App.tsx` reads `user` but does not use it to protect routes.

**Styling/UI:**
- No CSS files, component library, or design system exists in the current repo.
- Page components return raw placeholder `<div>` elements.

---
*Architecture analysis: 2026-05-24*
*Update when major patterns change*
