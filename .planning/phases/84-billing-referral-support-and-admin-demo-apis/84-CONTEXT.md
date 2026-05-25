# Phase 84: Billing, Referral, Support, and Admin Demo APIs - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Stabilize commercial, support, and operational demo APIs.

</domain>

<decisions>
## Implementation Decisions

Use static demo billing/referral responses and local support/admin state. Do not connect to Stripe, production support tooling, or production analytics.

</decisions>

<code_context>
## Existing Code Insights

Frontend services already expect billing, referral, support ticket, and admin analytics endpoints. Backend was missing most of those read endpoints.

</code_context>

<specifics>
## Specific Ideas

Add billing, referral, support ticket, admin analytics, admin support, admin help request, admin feedback, admin user, billing interest, and system status endpoints.

</specifics>

<deferred>
## Deferred Ideas

Production payment, support, analytics, and admin operations remain backend-owned future work.

</deferred>

