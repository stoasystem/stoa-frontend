# Phase 70: Advanced Analytics and Retention UI - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Render advanced analytics and retention operation UI using aggregated mock/API contract data. Do not implement production BI, raw event aggregation, churn model, or automation.
</domain>

<decisions>
## Implementation Decisions

- Use lightweight CSS charts instead of adding Recharts.
- Render pre-aggregated values.
- Retention actions are placeholder toasts.
</decisions>

<code_context>
## Existing Code Insights

Admin analytics page and cards already exist from Phase 11.
</code_context>

<specifics>
## Specific Ideas

Routes: `/admin/advanced-analytics`, `/organization/analytics`, `/admin/retention`.
</specifics>

<deferred>
## Deferred Ideas

Data warehouse, cohort computation, automated reminders.
</deferred>
