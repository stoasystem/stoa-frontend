# Stability Hardening Checklist

**Phase:** 18
**Created:** 2026-05-26

Phase 18 treats stability as part of production-facing polish. A clean sentence is not enough if a slow, empty, failing, or repeated-submit state still exposes internals or creates duplicate work.

## Duplicate Submit Guards

- [ ] Login submit button is disabled while pending and can retry after failure.
- [ ] Register submit button is disabled while pending and can retry after failure.
- [ ] Chat send/retry controls cannot send duplicate messages while pending.
- [ ] Teacher-help request controls cannot create duplicate requests while pending.
- [ ] Tutor status and note updates cannot be submitted repeatedly while pending.
- [ ] Support ticket and feedback forms cannot submit duplicate requests while pending.
- [ ] Billing and checkout buttons are disabled while pending.
- [ ] Upload controls show pending state and avoid repeated upload requests.

## Loading States

- [ ] Public pages never show technical loading copy.
- [ ] Chat uses product-safe explanation preparation copy.
- [ ] Parent/tutor/admin dashboards use stable skeletons or concise loading states.
- [ ] Billing/pricing loads without promising payment functionality before it is available.

## Empty States

- [ ] No conversations.
- [ ] No parent children.
- [ ] No learning report yet.
- [ ] No tutor requests.
- [ ] No billing usage.
- [ ] No support tickets.
- [ ] Empty states include either a next action or a clear expectation.

## Error States

- [ ] API errors do not expose endpoint names, provider/model names, raw exception strings, or mock/demo terms.
- [ ] User can retry or navigate away from recoverable errors.
- [ ] Unauthorized state asks the user to sign in.
- [ ] Forbidden state explains the page is not available for the current account.
- [ ] Unknown role falls back safely.

## Route Fallbacks

- [ ] Unknown routes show a friendly 404 page.
- [ ] Unauthorized routes redirect or explain sign-in is needed.
- [ ] Forbidden routes show user-friendly copy.
- [ ] Gated demo-only routes do not expose demo implementation details in normal mode.

## Verification

- [ ] `npm run build` passes.
- [ ] Relevant E2E/browser checks pass or documented limitations are recorded.
- [ ] Production-facing copy scan has no P0/P1 normal-mode failures.
