# Phase 128: Final Approval Intake and Launch Candidate Bug Triage - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 128 captures final approval changes, classifies launch-candidate bugs, and defines the allowed Phase 23 fix scope. It does not modify application code. The output is the release-control record that Phase 129 must follow.

</domain>

<decisions>
## Implementation Decisions

### Bug Intake Sources
- Seed Phase 128 from current browser review comments, current dirty UI/image fixes, existing release docs, and local smoke findings.
- Treat visible trust issues such as incorrect logo, weak header/footer contrast, public copy mistakes, locale copy drift, and broken core flows as P1.
- Record already-fixed review items as final approval changes with status `Fixed pending verification`.
- Move non-blocking polish into known issues or next-stage backlog instead of expanding Phase 23.

### Final Approval Change Records
- Record all must-fix review items, including the already-implemented logo, copy, header/footer contrast, and image archival work that still needs release verification.
- Use `Open`, `Fixed pending verification`, `Verified`, and `Deferred` as approval item statuses.
- Use P0/P1/P2/P3 for priority so approval changes and bug triage share the same release language.
- Record out-of-scope suggestions as `Deferred` when they need a visible decision trail.

### Output and Release-Control Boundaries
- Do not fix code in Phase 128.
- Use `docs/release/final-approval-changes.md` as the single approval and launch-candidate bug classification record.
- Treat current uncommitted UI/logo/image changes as implemented but unverified P1/P2 approval items.
- Phase 128 is complete when all known review items have ID, priority, decision, status, and next action, and Phase 129 fix scope is clear.

### the agent's Discretion
The agent may choose the exact table layout and wording for the release-control document as long as it preserves the required fields from Phase 23 and keeps the fix scope narrow.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/release/final-bug-triage.md` already defines P0/P1/P2/P3 severity rules.
- `docs/release/known-issues.md` already holds accepted P2/P3 launch-candidate issues.
- `docs/release/launch-candidate-approval.md` already lists launch-candidate approval gates.
- Current uncommitted files include homepage copy, logo component, header/footer contrast, and local image-asset updates.

### Established Patterns
- Release evidence is captured in Markdown under `docs/release/`, `docs/qa/`, and `docs/demo/`.
- GSD phase artifacts live under `.planning/phases/<phase-number>-<slug>/`.
- Phase 23 change control requires every code change to map to a bug, review item, or release blocker.

### Integration Points
- Phase 129 will consume this document as the allowed fix list.
- Phase 130 will verify the fixed items during final demo and smoke tests.
- Later release docs in Phase 131 and 132 must reference any deferred or accepted limitations.

</code_context>

<specifics>
## Specific Ideas

Use browser review comments as stakeholder final approval input: homepage eyebrow copy, logo image, footer contrast, header contrast, and local image archival.

</specifics>

<deferred>
## Deferred Ideas

New product features, page redesigns, new languages, navigation rewrites, production backend/AWS/payment work, and broad copy/design/translation reopening remain outside Phase 23.

</deferred>
