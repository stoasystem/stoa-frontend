---
status: complete
completed: "2026-05-27"
task: "Fix parent Reports navigation"
---

# Summary

Fixed the parent `Reports` navigation item by adding a real `/parent/reports` report hub instead of pointing it at the parent dashboard.

## Changes

- Added `ParentReportsPage` with report overview metrics and per-child weekly/monthly report links.
- Added `/parent/reports` to the router and route metadata.
- Updated parent nav item from `/parent` to `/parent/reports`.
- Updated app navigation active-state logic so broader role-root routes do not remain active when a more specific sibling route is active.

## Verification

- `npm run lint`
- `npm run build`
- Playwright parent login and click-through from `/parent` to `/parent/reports`
- Desktop and 390px mobile checks confirmed no horizontal overflow
