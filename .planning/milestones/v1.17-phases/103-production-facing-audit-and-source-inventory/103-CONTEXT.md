# Phase 103: Production-Facing Audit and Source Inventory - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Establish the calibrated Phase 18 audit baseline before implementation changes begin.
</domain>

<decisions>
## Implementation Decisions

### Agent Discretion

Discuss was skipped by project configuration. Use the roadmap, requirements, Phase 18 research, and existing STOA conventions. Preserve demo infrastructure where it is developer/test/internal, but classify and remove or gate user-visible development language later in the milestone.
</decisions>

<code_context>
## Existing Code Insights

The baseline scan found expected demo/mock terminology in docs, tests, service/data identifiers, route metadata, locale files, and some page/component copy. The important boundary for Phase 18 is not source-level word removal everywhere; it is preventing those terms from appearing in normal user-facing UI.
</code_context>

<specifics>
## Specific Ideas

- Create production-facing audit docs under `docs/qa`.
- Record allowed and disallowed locations for demo/mock/test terminology.
- Use P0/P1/P2 route priority to keep implementation scoped.
- Preserve local demo and E2E behavior for later guard phases.
</specifics>

<deferred>
## Deferred Ideas

Actual UI cleanup, env gating, display-label mapping, state hardening, README update, and runtime/browser verification are deferred to Phases 104-107.
</deferred>
