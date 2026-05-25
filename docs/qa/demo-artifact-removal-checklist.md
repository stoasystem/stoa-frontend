# Demo Artifact Removal Checklist

**Phase:** 18
**Created:** 2026-05-26

This checklist separates product UI cleanup from useful developer/demo infrastructure.

## User-Facing Cleanup

- [ ] Homepage does not show demo, mock, test, sample, placeholder, development, or Codex wording.
- [ ] Login does not show demo account credentials or test-account shortcuts in normal mode.
- [ ] Register and onboarding do not mention demo onboarding paths or public admin-account rules.
- [ ] Chat does not mention mock responses, Codex, providers, models, or demo assistant behavior.
- [ ] Parent dashboards and reports do not show demo child, sample report, or mock progress labels.
- [ ] Tutor and teacher-help flows do not show demo request, mock student, or raw queue status labels.
- [ ] Pricing and billing do not show mock checkout, fake subscription, or virtual checkout as normal user copy.
- [ ] Support and feedback do not expose internal/debug/development wording.
- [ ] Admin user-facing screens do not expose demo/development labels in normal mode.

## Guarding Checklist

- [ ] Demo account shortcuts are hidden unless explicit demo/development flags allow them.
- [ ] Demo badges are hidden unless explicit demo/development flags allow them.
- [ ] Internal debug panels are hidden unless development plus explicit debug flag allows them.
- [ ] Demo-only routes are hidden from normal navigation.
- [ ] Direct access to gated demo-only routes has a user-friendly fallback.
- [ ] E2E/local demo flows still work when explicit demo flags are enabled.

## Keep Internally

- [ ] `README.md` can document demo setup and local workflows.
- [ ] `docs/demo/**` and `docs/demo-backend/**` can document demo behavior.
- [ ] `tests/e2e/**` can use demo users and virtual checkout fixtures.
- [ ] Service and data identifiers such as `mockBillingPlans` can remain if their values are mapped before display.
- [ ] Backend/local reset scripts can retain demo terminology.

## Review Notes

Do not rename stable internal identifiers just to remove words from source. Phase 18 is about rendered user experience, not mechanical churn. If an internal string can appear in UI, add a display label or sanitization boundary.
