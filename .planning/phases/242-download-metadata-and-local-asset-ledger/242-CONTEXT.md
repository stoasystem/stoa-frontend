# Phase 242: Download Metadata And Local Asset Ledger - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous execution

<domain>
## Phase Boundary

Download suitable free candidates into an isolated Home V2 namespace and record complete metadata.
</domain>

<decisions>
## Implementation Decisions

- Store downloaded Pexels candidates in `img/home-v2/candidates/pexels/`.
- Use descriptive filenames with section role, source, and asset ID.
- Record metadata in a CSV ledger for later implementation handoff.
</decisions>

<code_context>
## Existing Code Insights

The current app references existing `img/` assets. New files are isolated and not imported by code.
</code_context>

<specifics>
## Specific Ideas

Verify downloaded files with `file` and `du` before committing.
</specifics>

<deferred>
## Deferred Ideas

Image optimization and generated responsive variants are deferred to the implementation milestone.
</deferred>
