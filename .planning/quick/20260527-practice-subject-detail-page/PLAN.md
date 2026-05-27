# Quick Task: Practice Subject Detail Page

Date: 2026-05-27

## Problem

The Practice overview currently expands subject details in place after selecting a subject. The intended information architecture is subject-first: `/practice` should be a subject selection page, and clicking a subject should enter a separate detail page for that subject's Practice Path.

## Scope

- Keep `/practice` focused on subject cards plus daily goal and streak.
- Make subject cards navigate to subject/topic routes instead of expanding details inline.
- Move Practice Path, current lesson, roadmap, and review work into the independent subject detail page.
- Show a clear prepared-state page for subjects whose Practice Path is not available yet.
- Verify desktop/mobile browser behavior, lint, and build.

## Verification

- Browser check `/practice` shows no inline Practice Path detail before clicking.
- Browser check clicking Mathematics navigates to the detail page with roadmap/current lesson.
- Browser check clicking Physics navigates to a prepared-state detail page, not the Mathematics roadmap.
- `npm run lint`
- `npm run build`
