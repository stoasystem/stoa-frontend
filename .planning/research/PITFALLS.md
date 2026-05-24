# Project Research: Pitfalls for v1.6 Phase 7

**Milestone:** v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness
**Date:** 2026-05-25

## UI Pitfalls

- **Polish drift.** Adding containers without migrating main pages leaves the app still feeling fragmented.
- **Nested card clutter.** Shared layout should avoid placing cards inside page-section cards.
- **Mobile chat squeeze.** A fixed sidebar can make mobile chat unusable; mobile needs a drawer or switcher pattern.
- **Skeleton layout shift.** Skeletons should approximate final dimensions rather than appearing as unrelated placeholders.

## Feedback Pitfalls

- **Toast-only validation.** Field validation errors should remain near fields; toast is for operation-level feedback.
- **Duplicate StrictMode toasts.** Avoid firing mount-based toasts without guards because development double-mount can duplicate them.
- **No recovery path.** Error boundary fallback needs a retry/reload action.

## Validation Pitfalls

- **Over-refactoring forms.** React Hook Form and Zod are useful, but small changes should not turn every component into a new abstraction.
- **Schema mismatch.** Form schemas should match API payloads and existing `UserRole` unions.
- **File validation regression.** Existing file type/size/count validation must be preserved while adding user feedback.

## Analytics Pitfalls

- **Vendor lock-in too early.** A thin local client keeps analytics replaceable.
- **PII in payloads.** Analytics payloads should use IDs, role, subject, status, and counts, not sensitive message content.
- **No opt flag.** Analytics should respect environment flags.

## Parent Report Pitfalls

- **Overpromising AI-generated insight.** Phase 7 can show seed/report structure without claiming automatic AI report generation.
- **Parent overexposure.** Report should summarize learning, not expose sensitive system internals.

## Tutor Workflow Pitfalls

- **Filters that hide all context.** Status filters should preserve clear empty states.
- **Teacher note writes without refresh.** Status/note mutations should invalidate tutor detail/list queries.

## Demo Pitfalls

- **Demo shortcuts in production.** Shortcuts must be hidden when `VITE_ENABLE_DEMO_SHORTCUTS=false`.
- **Seed data not aligned to story.** Demo data should support the student -> tutor -> parent value loop.
