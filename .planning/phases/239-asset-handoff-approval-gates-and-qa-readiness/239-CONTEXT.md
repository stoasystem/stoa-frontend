# Phase 239: Asset Handoff, Approval Gates, And QA Readiness - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss

<domain>
## Phase Boundary

Define Home V2 asset handoff, approval gates, QA readiness, and milestone closure. This phase does not implement image imports, localized copy, React components, or homepage replacement.

</domain>

<decisions>
## Implementation Decisions

### Handoff
- Later implementation needs candidate metadata, source URL, license notes, crop notes, AI status, alt text intent, storage path, and optimization target.
- Handoff should be explicit enough that implementation can insert assets without reopening source strategy.
- Alt text should describe communicative purpose, not decorative detail.
- Screenshot QA needs desktop and mobile first-viewport checks after implementation.

### Approval Gates
- Paid iStock candidates need budget and license approval.
- Identifiable children/families in Hero imagery need trust and release-risk approval.
- AI-generated or AI-enhanced people imagery needs explicit exception approval.
- Final binary commits need file-size, naming, license-metadata, and QA approval.

### Deferred Scope
- Do not change current `/`.
- Do not add asset imports, binary files, localized JSON, or React components.
- Do not claim final asset readiness until candidates are approved and acquired.
- Keep this milestone as strategy and readiness only.

### the agent's Discretion
The agent may mark v2.8 complete once requirements, roadmap, state, phase verification, audit, and archive docs are consistent.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Future implementation can use `public/img/home-v2/` as the static asset namespace.

### Established Patterns
- Prior Home V2 milestones close with audit and archive files while leaving current `/` unchanged.

### Integration Points
- Output feeds future acquisition, asset insertion, and visual QA milestones.

</code_context>

<specifics>
## Specific Ideas

This milestone should answer "what images should we look for and how do we decide safely?" It should not yet answer "which final image file is committed?"

</specifics>

<deferred>
## Deferred Ideas

Downloading/purchasing assets, committing image binaries, implementing Home V2, and replacing `/` remain deferred.

</deferred>
