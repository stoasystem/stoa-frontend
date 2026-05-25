# Route Map

Phase 13 groups routes by product role and visibility. App-owned routes remain in this frontend; marketing-site candidates should be hidden from app navigation and used only in demo/public flows.

## Public Routes

| Route | Decision | Notes |
|-------|----------|-------|
| `/` | App-owned for now | Minimal STOA entry. |
| `/login`, `/register`, `/forgot-password` | App-owned | Auth routes. Password recovery remains placeholder. |
| `/pricing` | App-owned shared conversion | Can be linked from parent report/billing. |
| `/for-parents`, `/how-it-works`, `/ai-homework-help`, `/teacher-support` | Marketing-site candidates | Keep hidden from authenticated app nav. |
| `/for-schools`, `/for-tutoring-centers`, `/partnership/onboarding` | Public demo/partnership | Demo flow routes; not core app nav. |
| `/privacy`, `/terms`, `/support` | App-owned required support/legal | Keep reachable from app shell. |

## Student Routes

Primary student routes:

- `/dashboard`
- `/chat`
- `/learning-history`
- `/profile`

Advanced student learning intelligence pages are not primary student nav items. They should be reached through dashboard/report/contextual cards:

- `/students/:studentId/learning-profile`
- `/students/:studentId/curriculum-graph`
- `/students/:studentId/diagnosis`

## Parent Routes

Primary parent routes:

- `/parent`
- `/billing`
- `/referrals`
- `/support`

Child routes are contextual:

- `/parent/children/:childId`
- `/parent/children/:childId/report`
- `/parent/children/:childId/monthly-report`
- `/parent/children/:childId/history`

Report consolidation decision: weekly report, monthly report, and history should behave like one report/detail area. Phase 13 keeps existing routes but documents a future tab strategy rather than deleting pages.

## Tutor Routes

Primary tutor routes:

- `/tutor`
- `/tutor/availability`
- `/support`

Detail route:

- `/tutor/requests/:requestId`

Request detail must always return to `/tutor`. Availability can later move under tutor settings, but remains primary while tutor workflow is small.

## Admin Routes

Primary admin routes:

- `/admin`
- `/admin/usage`
- `/admin/help-requests`
- `/admin/support`

Secondary admin routes:

- `/admin/analytics`
- `/admin/users`

Hidden/demo/placeholder routes:

- `/admin/advanced-analytics`
- `/admin/retention`
- `/admin/feedback`
- `/admin/billing-interest`
- `/admin/system`
- `/admin/support/:ticketId`

Consolidation decision: usage and analytics overlap, but both remain for now because usage is operational and analytics is reporting. Feedback should be treated as part of support inbox in future IA.

## Organization Routes

Organization-mode navigation:

- `/organization`
- `/organization/students`
- `/organization/tutors`
- `/organization/reports`
- `/organization/analytics`

Advanced organization/demo routes:

- `/organization/tutor-assignment`
- `/organization/students/:studentId/learning-profile`

Organization routes remain demo/organization-mode surfaces. They should not appear in default student, parent, tutor, or admin primary navigation.

## Demo Advanced Routes

Routes visible in docs/demo flows or contextual cards only:

- `/admin/advanced-analytics`
- `/admin/retention`
- `/organization/tutor-assignment`
- `/students/:studentId/learning-profile`
- `/students/:studentId/diagnosis`
- `/students/:studentId/curriculum-graph`
- `/curriculum-graph`
- `/parent/children/:childId/monthly-report`
- `/partnership/onboarding`

## Route Ownership Rule

If a route is `core`, it needs a visible nav item or contextual entry. If it is `demo`, it needs a demo-flow entry or internal card. If it is `placeholder`, it must not be presented as production-ready. If it is `duplicate`, keep one preferred path and hide the alias from navigation.
