# Quick Task: Student Login Dashboard Redirect

## Goal

Ensure student login lands on `/dashboard` by default instead of returning to Learning Chat after an unauthenticated `/chat` visit.

## Plan

1. Keep the explicit student `next=/practice` flow working.
2. Remove `/chat` from student login next-path allowlist so chat is not used as a post-login landing page.
3. Verify with build and browser checks.
