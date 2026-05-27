# Quick Task: Reorganize Practice Overview Layout

**Created:** 2026-05-27
**Status:** Complete

## Request

The Practice page content is useful but the layout is messy. It should first show subjects, daily goal, and study streak. Practice Path, current lesson, roadmap, and review content should appear only after a subject is selected.

## Plan

- Move subject selection and learning rhythm metrics to the top of `/practice`.
- Add local subject selection state so path-specific content is gated behind a selected subject.
- Render Practice Path, current lesson, roadmap, and recent mistake review only for the selected subject.
- Keep the existing Practice data and route behavior intact.
- Run lint/build and verify desktop/mobile browser layout.
