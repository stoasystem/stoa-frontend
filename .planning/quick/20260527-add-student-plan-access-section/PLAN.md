---
status: complete
created: "2026-05-27"
task: "Add student plan and usage information"
---

# Quick Task: Add Student Plan And Usage Information

## Goal

Expose plan and usage quota information on the student dashboard, matching the parent billing visibility for usage quota and selected plan.

## Scope

- Add a student dashboard section for usage quota and selected plan.
- Reuse existing billing data hooks and usage card where possible.
- Keep the layout compact so it does not disrupt the main learning actions.

## Verification

- `npm run lint`
- `npm run build`
- Browser check student `/dashboard` desktop/mobile rendering.

## Result

Complete. Student dashboard now includes `Plan and access` with usage quota and selected plan visibility, using the existing billing usage and plan data.
