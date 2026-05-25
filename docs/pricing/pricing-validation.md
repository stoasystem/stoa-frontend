# Pricing Validation

## Goal

Validate whether parents understand STOA's value and are willing to move from pilot access toward paid family or tutor-supported plans.

## Assumptions

- Parents pay for visibility into learning progress, not just AI chat.
- Tutor support is a premium signal when AI explanations are not enough.
- Virtual checkout can validate page content, CTA placement, and QA flow before real payment backend rollout.

## Signals To Track

- `pricing_page_viewed`
- `pricing_plan_selected`
- `parent_upgrade_cta_clicked`
- `billing_checkout_started`
- `billing_virtual_checkout_completed`
- `billing_virtual_checkout_canceled`

## Decision Criteria

- Parents can explain the difference between Student, Family, and Tutor-supported plans.
- At least some parents click upgrade CTAs from dashboard or report.
- Pricing and billing screens are understandable during manual QA.
- Virtual checkout flow can be completed and canceled without backend payment infrastructure.

## Out of Scope

Real payment enforcement, invoices, taxes, coupons, refunds, and accounting remain outside Phase 10.
