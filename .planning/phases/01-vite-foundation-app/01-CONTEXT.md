# Phase 1: Vite Foundation App - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Complete the standard Vite React TypeScript scaffold and replace placeholder/demo UI with a minimal STOA initialization page.
</domain>

<decisions>
## Implementation Decisions

### Keep Phase 1 Minimal
The root app should render only the STOA initialization page. Later auth, routing, query, API, and dashboard behavior remains out of scope for this phase.

### Preserve Existing Supporting Files Unless They Block Foundation
Existing API/auth/store files can remain in the repository if they do not affect the Phase 1 root page, build, or lint checks.
</decisions>

<code_context>
## Existing Code Insights

- `src/App.tsx` exposed role routes and TODO pages before this phase.
- `src/main.tsx` configured Amplify and React Query before any Phase 1 need existed.
- Standard Vite scaffold files were missing: `index.html`, TypeScript configs, Vite env types, and CSS entry.
- `package.json` had scripts but no lockfile or ESLint config.
</code_context>

<specifics>
## Specific Ideas

- Add standard Vite HTML and TypeScript config files.
- Simplify `src/main.tsx` to render the app directly.
- Replace route placeholder surface with a minimal STOA success page.
- Add basic CSS that centers the initialization page.
</specifics>

<deferred>
## Deferred Ideas

- Formal role routing.
- Cognito login UX.
- API-backed student/parent/teacher/admin pages.
- Tailwind/shadcn component system.
</deferred>
