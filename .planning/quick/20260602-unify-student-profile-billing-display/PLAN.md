# Quick Task: Unify Student Profile Billing Display

**Created:** 2026-06-02
**Status:** Complete

## Request

The student profile page showed a student billing status of Trial while the linked parent payment section showed Family plan. The billing display should use one consistent source of truth.

## Plan

- Keep guardian and payment-owner context from the student profile data.
- Source the displayed billing plan, billing status, and period end from the active billing subscription query.
- Preserve a fallback for unavailable subscription data so the profile can still render.
- Run lint/build and verify `/profile` in the browser.
