---
status: complete
completed: "2026-05-27"
task: "Add student plan and usage information"
---

# Summary

Added plan and access visibility to the student dashboard so students can see the same usage quota and plan context shown in billing.

## Changes

- Added `StudentPlanAccessSection`.
- Reused existing billing usage, plans, and subscription hooks.
- Added a compact `Plan and access` section to `/dashboard`.
- Clarified that students can see learning access but parent billing manages payment details.

## Verification

- `npm run lint`
- `npm run build`
- Playwright desktop and mobile checks on student `/dashboard`
- Confirmed `Usage quota`, `Selected plan`, and no horizontal overflow
