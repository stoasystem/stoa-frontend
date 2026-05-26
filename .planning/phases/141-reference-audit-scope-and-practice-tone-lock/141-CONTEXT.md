# Phase 141: Reference Audit, Scope, and Practice Tone Lock - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Auto-generated from roadmap, research, and user emphasis

<domain>
## Phase Boundary

Phase 141 locks the Practice Path product boundary before implementation. The user clarified that Phase 27 is primarily frontend design work. The implementation should include simple enough functionality for UI interaction testing and demo flow validation, not a production learning system.
</domain>

<decisions>
## Implementation Decisions

- Use `Practice Path` as the primary user-facing module name.
- Treat `sanidhyy/duolingo-clone` as interaction inspiration only.
- Translate language-course mechanics into STOA subject-based Mathematics and Physics practice.
- Use attempts, progress points, daily goals, study streak, hints, and mistakes review as neutral learning language.
- Avoid hearts/lives scarcity, shop/gems, leaderboard, mascot-driven visuals, loud celebrations, and provider/debug language.
</decisions>

<code_context>
## Existing Code Insights

- Research artifacts exist under `.planning/research/`.
- STOA already has premium theme tokens, role navigation, i18n, demo fallback services, dashboard cards, parent report cards, and Learning Assistant/teacher support patterns.
</code_context>

<specifics>
## Specific Ideas

- Create the required `docs/practice/*` reference/scope/UI docs.
- Keep documentation concise and implementation-facing.
- Use docs to reinforce that later phases should build frontend demo interaction only.
</specifics>

<deferred>
## Deferred Ideas

- Full content quality review belongs to Phase 28.
- Real backend, adaptive learning, and course database remain out of scope.
</deferred>
