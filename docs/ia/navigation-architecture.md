# Navigation Architecture

Phase 13 navigation uses a calm operational structure: one role, one clear primary path, no demo sprawl in the main sidebar. Route metadata lives in `src/app/router/routeConfig.ts`; filtering lives in `src/lib/navigation.ts`.

## Principles

1. Primary nav contains high-frequency tasks only.
2. Secondary nav supports the role but does not compete with the main workflow.
3. Hidden/demo routes are reached through contextual cards or demo docs, not core nav.
4. Repeated navigation keeps the same order and labels across pages.
5. Mobile nav is a smaller role-specific subset, not a compressed desktop sidebar.

## Student Navigation

Primary:

- Dashboard
- Chat
- Learning History
- Profile

Hidden/contextual:

- Learning Profile
- Curriculum Graph
- Diagnosis
- Billing
- Referrals

Reason: the student's core job is continue learning, ask a question, review history, and maintain profile. Advanced analysis should support learning but not distract from chat.

## Parent Navigation

Primary:

- Overview
- Reports
- Billing

Secondary:

- Referrals
- Support

Child summary, weekly report, monthly report, and history are reached from child cards and report CTAs.

## Tutor Navigation

Primary:

- Requests
- Availability

Secondary:

- Support

Request detail is not a nav item; it is opened from the request queue and returns there.

## Admin Navigation

Primary:

- Overview
- Learning Activity
- Help Requests
- Support Inbox

Secondary:

- Analytics
- Users

Hidden:

- Advanced Analytics
- Retention
- Feedback
- Billing Interest
- System

Reason: the admin shell was too long. Phase 13 keeps the important operations reachable and hides demo/future surfaces from primary navigation.

## Organization Navigation

Primary:

- Overview
- Students
- Tutors
- Reports

Secondary:

- Analytics

Hidden/contextual:

- Tutor Assignment
- Organization student learning profile

Organization navigation appears only for organization-mode roles: `organization_admin`, `school_teacher`, and `school_viewer`.

## Mobile Navigation

Mobile nav uses three to five role destinations:

- Student: Dashboard, Chat, Profile
- Parent: Overview, Reports, Billing
- Tutor: Requests, Availability
- Admin: Overview, Learning Activity, Help Requests, Support Inbox
- Organization: Overview, Students, Tutors

Admin and organization pages can use scan-friendly content cards rather than full desktop parity on mobile.
