# Phase 129: Blocker Fixes and Release Lock Preservation - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 129 verifies and finalizes only the Phase 128 approved release-blocker fixes. It preserves copy, design, translation, and demo API locks while confirming the current code changes do not regress build, mobile layout, core public pages, or user-facing terminology.

</domain>

<decisions>
## Implementation Decisions

### Approved Fix Scope
- Include the current uncommitted UI/logo/image changes because they map directly to FAC-001 through FAC-005.
- Allow only concrete regression corrections for FAC-001 through FAC-005.
- Do not add new low-risk polish outside the approval list.
- Do not modify the demo API contract.

### Verification Strategy
- Verify FAC-001 with source scans across EN/DE/FR/IT locale files, copy rules, and homepage browser smoke.
- Verify FAC-002 with `StoaLogo` source inspection and browser checks on `/` and `/contact`.
- Verify FAC-003 and FAC-004 with source inspection plus browser checks for header/footer backgrounds.
- Verify FAC-005 with source scans for local `img/` references, remote image URL absence, build output, and browser image checks.

### Lock Preservation
- Record lock recheck evidence in `docs/release/phase-23-lock-preservation.md`.
- Update `docs/release/final-approval-changes.md` statuses only after source, build, and browser checks pass.
- Keep old lock docs intact; do not rewrite broad copy/design/translation/API locks.

### the agent's Discretion
The agent may choose exact verification wording and evidence format, but all evidence must map back to Phase 128 FAC items and Phase 129 lock requirements.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/release/final-approval-changes.md` lists FAC-001 through FAC-005 and allowed Phase 129 scope.
- `StoaLogo` centralizes global logo rendering.
- `MarketingLayout` owns the public sticky header.
- `AppFooter` owns footer rendering.
- Homepage, pricing, login, parent, and teacher-support components own the image references that were archived locally.

### Established Patterns
- Release evidence is documented under `docs/release/`.
- Phase artifacts include context, plan, summary, and verification markdown files.
- Verification combines source scan, build/lint, local dev server check, and browser smoke evidence.

### Integration Points
- Phase 130 will consume these verified fixes during the full public demo final run.
- Phase 131 and 132 will reference the public demo release state and remaining non-blocking limitations.

</code_context>

<specifics>
## Specific Ideas

Preserve the current fixed UI while documenting exactly why each change is allowed despite copy/design/translation locks.

</specifics>

<deferred>
## Deferred Ideas

Browser/device matrix completion, screen-reader smoke, and broader final demo rerun belong to Phase 130.

</deferred>
