# Phase 11 manual QA checklist

## Billing and pricing

- [x] `/pricing` displays plans and recommended plan.
- [x] `/billing` displays subscription status, usage quota, selected plan, demo payment mode, checkout action, and manage billing placeholder.
- [x] Virtual checkout can complete and cancel.

## Feature gating

- [x] Feature access contract can return locked state.
- [x] Locked feature card routes users to pricing.
- [x] Chat, upload, and teacher-help UI read feature access contract without treating frontend state as enforcement.

## Parent funnel

- [x] `/for-parents` is accessible.
- [x] `/how-it-works` is accessible.
- [x] `/teacher-support` is accessible.
- [x] Partner placeholders are accessible.

## Referral

- [x] `/referrals` displays deterministic invite link and invite count.
- [x] Copy action triggers an analytics event.
- [x] `/register?ref=CODE` stores referral code for registration payload.

## Tutor availability

- [x] `/tutor/availability` displays current availability and subjects.
- [x] Tutor can edit weekly slots and subjects in demo state.
- [x] Save mutation shows success toast and invalidates query state.

## Support tickets

- [x] `/support/tickets` displays create form and ticket list.
- [x] `/support/tickets/:ticketId` displays ticket detail.
- [x] `/admin/support` displays admin ticket queue.
- [x] `/admin/support/:ticketId` supports mock status update.

## Admin analytics

- [x] `/admin/analytics` displays active users, registrations, usage, checkout, and cancelled subscription metrics.

## UTM and build

- [x] UTM capture stores whitelisted metadata.
- [x] `npm run lint` passes.
- [x] `npm run build` passes.
- [x] `npm run test:e2e` passes.
