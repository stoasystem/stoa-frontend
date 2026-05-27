# Summary: Practice Subject Detail Page

Date: 2026-05-27

## Changes

- Changed `/practice` into a subject selection page with subject cards, daily goal, and study streak only.
- Changed subject card actions into links to independent subject/topic pages.
- Moved Practice Path details, current lesson, roadmap, and review work into `/practice/:subjectId/:topicId`.
- Added a prepared-state detail page for unavailable subjects such as Physics, so they do not show Mathematics roadmap content.

## Verification

- Browser check `/practice` confirms subject selection only and no inline roadmap.
- Browser check `/practice/mathematics/equations` confirms roadmap/current lesson/review work on the detail page.
- Browser check `/practice/physics/forces-motion` confirms prepared-state preview and no Mathematics roadmap.
- Browser mobile check on `/practice`.
- `npm run lint`
- `npm run build`
