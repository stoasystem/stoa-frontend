---
status: complete
created: "2026-05-27"
task: "Fix parent Reports navigation"
---

# Quick Task: Fix Parent Reports Navigation

## Goal

Make the parent `Reports` navigation item lead to an actual reports page instead of pointing to the same `/parent` dashboard as `Overview`.

## Scope

- Add a `/parent/reports` page that gives parents a clear report hub.
- Link each child to weekly and monthly report routes from that hub.
- Update parent navigation and route metadata.
- Adjust app navigation active-state logic so root role routes do not stay highlighted when a more specific sibling route is active.

## Verification

- `npm run lint`
- `npm run build`
- Browser check `/parent` -> Reports navigation and `/parent/reports` desktop/mobile rendering.

## Result

Complete. Parent `Reports` now routes to `/parent/reports`, with weekly and monthly report entry cards per linked child and corrected navigation active-state behavior.
