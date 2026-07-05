# Phase 261: Cross-Locale Verification And Readiness Handoff - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Close v6.3 with technical verification, responsive screenshot evidence, locale/runtime limitation notes, and a readiness judgment. Do not replace `/`.
</domain>

<decisions>
## Implementation Decisions

- Treat EN/DE as rendered runtime verification because they are the currently supported languages.
- Treat FR/IT as static Home V2 copy assets because they are not currently wired into runtime language selection.
- Readiness conclusion must separate "ready to prepare switch" from "switch now".
</decisions>

<code_context>
## Existing Code Insights

- `src/i18n/languages.ts` exposes `en` and `de`.
- `fr/it/homeV2.json` exist but are not imported by `src/i18n/index.ts`.
- `/home-v2` remains separate from `/`.
</code_context>

<specifics>
## Specific Ideas

- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run test:e2e -- home-v2.spec.ts`.
- Capture EN desktop/mobile and DE mobile final screenshots.
- Produce readiness report with switch-over boundaries.
</specifics>

<deferred>
## Deferred Ideas

- Public homepage route replacement.
- Final paid/commissioned photography purchase.
- Runtime FR/IT enablement.
- SEO/sitemap/canonical work for switch-over.
</deferred>
