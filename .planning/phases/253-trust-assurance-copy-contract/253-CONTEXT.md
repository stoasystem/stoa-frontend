# Phase 253: Trust Assurance Copy Contract - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Define precise Trust/Assurance language without slogan-heavy privacy, compliance, AI, or repeated Swiss framing.
</domain>

<decisions>
## Implementation Decisions

### Copy Contract
- Replace "Swiss trust layer" with "Assurance by design".
- Use the promise "Confidence without hovering." to express parental relief without intervention.
- Principles should describe service behavior: enough context, clear boundaries, discussable progress, and no inflated promises.
- Avoid repeated "Swiss", loud privacy language, compliance theater, monitoring/surveillance framing, and instant-improvement claims.

### the agent's Discretion
Locale phrasing may be adapted naturally as long as each language preserves restraint and the same behavioral meaning.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/i18n/locales/en/homeV2.json`
- `src/i18n/locales/de/homeV2.json`
- `src/i18n/locales/fr/homeV2.json`
- `src/i18n/locales/it/homeV2.json`

### Established Patterns
- Home V2 copy is namespaced under `trustLayer`.
- Existing locale files use ASCII transliterations for accented text.

### Integration Points
- `HomeV2TrustLayer.tsx` reads `trustLayer` through `react-i18next`.
</code_context>

<specifics>
## Specific Ideas

The section should show that parents no longer need to anxiously intervene in every answer.
</specifics>

<deferred>
## Deferred Ideas

Legal policy language and a full homepage copy pass remain outside v6.2.
</deferred>
