---
status: complete
completed: 2026-05-25
type: quick
---

# Add marketing visuals

## Completed

- Added a laptop study visual panel to the homepage learning-flow section.
- Added a teacher/student photo panel to the homepage teacher fallback section.
- Added a parent/child photo panel to the homepage parent visibility section.
- Reworked the homepage trust section with user-facing copy and a study-material image panel.
- Added image-backed panels to the parent landing page, teacher support explainer, and pricing page.

## Verification

- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build` passed with the existing Vite large chunk warning and Node deprecation warning.
- Playwright visual coverage check:
  - `/`: 5 main images
  - `/for-parents`: 2 main images
  - `/teacher-support`: 1 main image
  - `/pricing`: 1 main image
- Playwright confirmed old homepage developer copy (`Demo-ready`, `Backend-ready`, `Frontend depends on API contracts`) is gone.
