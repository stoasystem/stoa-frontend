# Coding Conventions

**Analysis Date:** 2026-05-24

## Naming Patterns

**Files:**
- Page components use PascalCase `.tsx` files: `src/pages/student/Home.tsx`, `src/pages/parent/Dashboard.tsx`.
- Store modules use camelCase with `Store` suffix: `src/stores/authStore.ts`, `src/stores/questionStore.ts`.
- Shared client modules use short camelCase names: `src/lib/api.ts`, `src/lib/amplify.ts`.
- No test file naming pattern is established yet.

**Functions:**
- React components use PascalCase function names matching the default export intent: `StudentHome`, `TeacherQueue`.
- Store setters use `setX` names: `setUser`, `setPendingImageKey`.
- No async feature functions are implemented yet beyond interceptors.

**Variables:**
- camelCase for local variables: `queryClient`, `amplifyConfig`, `pendingImageKey`.
- No constants naming convention beyond exported `amplifyConfig`.
- No private marker convention exists.

**Types:**
- Interfaces use PascalCase: `User`, `AuthState`, `QuestionState`.
- String-literal unions are used for role and subscription tier values in `src/stores/authStore.ts`.
- No enum pattern exists.

## Code Style

**Formatting:**
- Existing files use 2-space indentation.
- Existing imports and strings use single quotes.
- Semicolons are omitted.
- Trailing commas appear in multiline calls/objects.
- JSX is currently minimal and unstyled.

**Linting:**
- `package.json` defines `npm run lint` as `eslint . --ext ts,tsx`.
- ESLint `^9.0.0` is installed as a dev dependency.
- No `eslint.config.*` or `.eslintrc*` file exists, so the lint command is not yet backed by a checked-in config.

## Import Organization

**Order:**
1. External packages first: `react`, `react-dom/client`, `react-router-dom`, `@tanstack/react-query`, `aws-amplify`, `axios`.
2. Internal relative imports after external imports: `./App`, `./lib/amplify`, `./stores/authStore`.
3. Page imports are grouped by role comment in `src/App.tsx`.

**Grouping:**
- No blank lines between import groups in current files.
- No enforced alphabetical ordering is visible.

**Path Aliases:**
- No path aliases are configured.
- Imports use relative paths such as `./stores/authStore`.

## Error Handling

**Patterns:**
- API request auth lookup failures are swallowed in `src/lib/api.ts` to allow public requests.
- API response 401 errors trigger global sign-out and browser redirect to `/login`.
- All other Axios errors are rethrown with `Promise.reject(error)`.

**Error Types:**
- No custom error types exist.
- No domain-level error result pattern exists.
- No feature pages currently render loading or error states.

## Logging

**Framework:**
- No logging framework is present.
- No `console.log` usage was found in `src/`.

**Patterns:**
- No logging pattern has been established yet.

## Comments

**When to Comment:**
- Comments are sparse and currently used for route grouping and API interceptor intent.
- Examples:
  - `// Pages — lazy loaded` in `src/App.tsx`, though the imports are currently eager, not lazy.
  - `// Inject Cognito JWT on every request` in `src/lib/api.ts`.
  - `// 401 → sign out` in `src/lib/api.ts`.

**JSDoc/TSDoc:**
- No JSDoc or TSDoc usage exists.

**TODO Comments:**
- Page placeholder text contains `TODO`, but no code comments use `TODO`.

## Function Design

**Size:**
- Current modules are small and single-purpose.
- Route components are one-line placeholders.

**Parameters:**
- Store setters accept typed values directly.
- No complex parameter patterns exist.

**Return Values:**
- React page components return JSX directly.
- Zustand stores return object literals from `create`.
- Interceptors return modified config or reject errors.

## Module Design

**Exports:**
- React page components use default exports.
- Stores use named exports (`useAuthStore`, `useQuestionStore`).
- `src/lib/api.ts` default-exports the Axios instance.
- `src/lib/amplify.ts` named-exports `amplifyConfig`.

**Barrel Files:**
- No `index.ts` barrel files are used.

**State Boundaries:**
- Use Zustand for durable cross-route client state.
- Use TanStack Query for server data once API-backed pages are implemented.
- Avoid duplicating server data into Zustand unless it is needed outside query lifecycles.

---
*Convention analysis: 2026-05-24*
*Update when patterns change*
