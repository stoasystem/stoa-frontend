# Mobile Navigation

Phase 13 mobile navigation keeps only the highest-value role destinations. Desktop sidebars should not be copied wholesale into small screens.

## Role Destinations

| Role | Mobile Items | Notes |
|------|--------------|-------|
| Student | Dashboard, Chat, Profile | Chat is the highest priority; bottom nav must not cover chat input. |
| Parent | Overview, Reports, Billing | Reports enters through child selection when needed. |
| Tutor | Requests, Availability | Request detail uses back button/breadcrumb. |
| Admin | Overview, Learning Activity, Help Requests, Support Inbox | Admin mobile can be cards/list focused. |
| Organization | Overview, Students, Tutors | Reports/analytics remain reachable from page content or desktop nav. |

## Interaction Rules

1. Keep mobile primary navigation at five items or fewer.
2. Prefer clear labels with icons from lucide-react.
3. Detail pages need a visible return path near the top.
4. Avoid placing fixed nav over chat, forms, or checkout actions.
5. Tables should degrade into scannable cards/lists where feasible.

## QA Pages

Check these pages at mobile width:

- `/chat`
- `/dashboard`
- `/parent`
- `/parent/children/:childId/report`
- `/parent/children/:childId/monthly-report`
- `/tutor`
- `/tutor/requests/:requestId`
- `/pricing`
- `/billing`
- `/organization`
- `/organization/students`
