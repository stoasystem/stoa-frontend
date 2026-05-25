# Phase 98: Copy Governance and Scope Lock - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Developers need clear locale-specific writing rules and scope boundaries before any Phase 17 copy or layout changes are made.

Phase 17 refines the existing English, German, French, and Italian STOA UI. It does not add new business features, new languages, backend preference systems, CMS/TMS tooling, automated translation, SEO localization, or legal-final translation.
</domain>

<decisions>
## Implementation Decisions

### Agent Discretion

Use the roadmap phase goal, requirements LCOPY-01 through LCOPY-07, Phase 17 research summary, and existing `docs/language` conventions. Keep this phase documentation-only.
</decisions>

<code_context>
## Existing Code Insights

Phase 16 already provides:

- `docs/language/glossary.md`
- `docs/language/copy-style-guide.md`
- `docs/language/terminology-replacement.md`
- `docs/language/translation-qa-checklist.md`
- EN/DE/FR/IT locale files under `src/i18n/locales`
</code_context>

<specifics>
## Specific Ideas

- Add shared locale copy rules.
- Add German, French, and Italian copy rule docs.
- Update glossary, copy style guide, and translation QA checklist with Phase 17 rules.
- Make the non-feature-expansion boundary explicit.
</specifics>

<deferred>
## Deferred Ideas

Implementation changes such as `titleLines`, `localeLayout`, source copy rewrites, CSS tuning, and visual QA evidence are deferred to later Phase 17 phases.
</deferred>
