# Phase 4: Styling and UI Foundation - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Configure TailwindCSS, shadcn-style UI primitives, lucide icons, alias support, STOA theme tokens, and design notes.
</domain>

<decisions>
## Implementation Decisions

### Tailwind v4 Vite Plugin
Use `@tailwindcss/vite` and CSS-first theme variables in `src/index.css`.

### Local shadcn-style Components
Implement copyable local UI primitives in `src/components/ui/`, backed by Radix where appropriate.
</decisions>

<code_context>
## Existing Code Insights

- v1.0 had plain CSS and no `@` alias.
- Existing dependencies already included React Router, TanStack Query, Zustand, and Axios.
- Phase 4 added the UI system before routing/pages so the acceptance page can use real primitives.
</code_context>

<specifics>
## Specific Ideas

- Add Tailwind plugin to Vite.
- Add `@/*` alias to Vite and TypeScript.
- Add `src/styles/stoa-theme.css` and `src/styles/design-notes.md`.
- Add `cn` utility and local UI primitive files.
</specifics>

<deferred>
## Deferred Ideas

- Final STOA homepage visual extraction from `stoaedu/newweb`.
- Full design system documentation.
</deferred>
