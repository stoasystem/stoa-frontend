# STOA Frontend Current Project and Demo Guide

**Last updated:** 2026-05-25

This document summarizes what the STOA frontend currently implements and how to run the local demo experience. It is intended for developers, product reviewers, and anyone preparing a STOA demo.

## Phase 15 Demo Update

The current demo now starts with a redesigned homepage and a student-first learning path:

1. Open `/`.
2. Click `Start Learning`.
3. If not logged in, sign in or create an account.
4. Students continue to `/chat` and ask a homework question directly.
5. STOA AI answers first.
6. The teacher request action appears inline below the AI response.
7. Parents can follow learning history and reports from `/parent`.

The homepage no longer presents `AI Support`, `Teacher Backup`, and `Parent Visibility` as three equal product entries. Those capabilities are now explained as one ordered learning flow.

New registration demo paths:

- Student: age, school, grade, subjects, and parent link fields.
- Parent: child profile and subjects needing help.
- Tutor: teaching profile plus mock credential upload.

Tutor credential upload is demo-only. Uploaded documents are marked `pending_review`; no real verification or OCR is performed.

## 1. Current Project Status

STOA Frontend is a React + TypeScript + Vite application for the STOA learning platform. The project has moved beyond a basic scaffold and now includes a broad demo-ready product surface:

- student learning dashboard and AI chat
- authenticated role boundaries
- parent overview, learning history, weekly report, and monthly report placeholder
- tutor help-request workflow
- admin operations and analytics surfaces
- pricing, billing, usage quota, feature access, and mock checkout
- referrals, support tickets, feedback, and operational demo data
- organization, school, partnership, and learning-intelligence demo surfaces
- role-based navigation, route inventory, breadcrumbs, back buttons, page actions, mobile navigation guidance, and final demo flow documentation
- lightweight local demo backend with fixed demo accounts, resettable seed data, and API mode configuration

The current system is suitable for local frontend development, stakeholder demos, and backend integration planning. It is not a production backend or a production launch stack.

## 2. What Has Been Implemented

### 2.1 Frontend Foundation

Implemented:

- React + TypeScript + Vite application foundation.
- npm workflow: install, dev server, lint, build, preview.
- TailwindCSS and local shadcn-style UI primitives.
- React Router route structure.
- TanStack Query provider setup.
- Zustand auth/state stores.
- Axios-based shared HTTP client.
- Shared UI components for page layout, headers, state rendering, buttons, cards, badges, forms, tables, breadcrumbs, back buttons, page actions, dialogs, and feedback patterns.

Primary files:

- `src/main.tsx`
- `src/App.tsx`
- `src/services/api/httpClient.ts`
- `src/lib/env.ts`
- `src/app/router/routeConfig.ts`
- `src/app/router/routeGroups.ts`
- `src/lib/navigation.ts`

### 2.2 Authentication and Roles

Implemented:

- login page
- register page
- current-user hydration
- local token persistence
- logout behavior
- protected routes
- role-aware route guards
- role-aware navigation
- demo accounts for student, parent, tutor, and admin

Current demo accounts:

| Role | Email | Password | Name |
|------|-------|----------|------|
| Student | `student@test.com` | `password123` | Anna Keller |
| Parent | `parent@test.com` | `password123` | Martin Keller |
| Tutor | `tutor@test.com` | `password123` | Dr. Lena Vogt |
| Admin | `admin@test.com` | `password123` | STOA Admin |

Important routes:

- `/login`
- `/register`
- `/forgot-password`
- `/forbidden`

### 2.3 Student Experience

Implemented:

- student dashboard
- AI chat workspace
- conversation list
- conversation detail
- message sending
- deterministic demo AI response
- mock streaming endpoint support
- uploaded file metadata in demo data
- teacher-help request flow
- learning history
- student profile
- advanced learning profile demo
- weak-point diagnosis demo
- curriculum graph demo

Important routes:

- `/dashboard`
- `/chat`
- `/learning-history`
- `/profile`
- `/students/:studentId/learning-profile`
- `/students/:studentId/diagnosis`
- `/students/:studentId/curriculum-graph`

Demo behavior:

- Student can log in and open existing conversations.
- Student can send a new message.
- The backend returns a stable demo AI response.
- Student can request teacher help from a conversation.
- Learning-intelligence pages are demo UI surfaces, not real AI diagnosis or graph computation.

### 2.4 Parent Experience

Implemented:

- parent overview
- linked child list
- child summary
- child learning history
- weekly parent report
- monthly report placeholder
- billing and subscription surfaces
- referral page
- support entry points

Important routes:

- `/parent`
- `/parent/children/:childId`
- `/parent/children/:childId/history`
- `/parent/children/:childId/report`
- `/parent/children/:childId/monthly-report`
- `/billing`
- `/referrals`
- `/support`

Demo behavior:

- Parent account is linked to Anna Keller.
- Parent can inspect learning history and report data.
- Monthly report is a placeholder for demo continuity.
- Parent can continue into billing, referral, and support flows.

### 2.5 Tutor Experience

Implemented:

- tutor request dashboard
- request detail page
- request status updates
- tutor notes
- tutor availability UI
- tutor assignment/schedule demo surfaces

Important routes:

- `/tutor`
- `/tutor/requests/:requestId`
- `/tutor/availability`
- `/organization/tutor-assignment`

Demo behavior:

- Tutor can see pending, assigned/in-progress, and resolved demo help requests.
- Tutor can open request detail and update status.
- Tutor can add notes.

### 2.6 Admin Experience

Implemented:

- admin overview
- usage summary
- help request operations view
- support ticket admin view
- support ticket detail/status update
- feedback list
- billing interest list
- system status placeholder
- analytics overview
- advanced analytics and retention demo surfaces

Important routes:

- `/admin`
- `/admin/usage`
- `/admin/help-requests`
- `/admin/support`
- `/admin/support/:ticketId`
- `/admin/feedback`
- `/admin/billing-interest`
- `/admin/system`
- `/admin/analytics`
- `/admin/advanced-analytics`
- `/admin/retention`

Demo behavior:

- Admin can inspect demo operational metrics.
- Admin can see support tickets, help requests, feedback, and billing interest.
- Advanced analytics and retention pages are demo surfaces, not production BI.

### 2.7 Billing, Pricing, Referral, Support, and Feedback

Implemented:

- pricing page
- billing page
- billing plan catalog
- current subscription mock data
- usage quota mock data
- feature access mock data
- mock checkout session
- virtual checkout success/cancel pages
- referral summary and invite link
- support request form
- support ticket list/detail/create
- feedback dialog and feedback API

Important routes:

- `/pricing`
- `/billing`
- `/billing/checkout/demo`
- `/billing/checkout/success`
- `/billing/checkout/cancel`
- `/billing/success`
- `/referrals`
- `/support`
- `/support/tickets`
- `/support/tickets/:ticketId`

Demo boundary:

- Mock checkout is not real payment.
- The frontend does not collect card details.
- Subscription enforcement is not production enforcement.

### 2.8 Organization, School, and Partnership Demo Surfaces

Implemented:

- organization selector
- organization dashboard
- organization students
- organization tutors
- organization reports
- organization analytics
- school partnership landing page
- tutoring center landing page
- partnership onboarding form

Important routes:

- `/organization`
- `/organization/students`
- `/organization/tutors`
- `/organization/reports`
- `/organization/analytics`
- `/for-schools`
- `/for-tutoring-centers`
- `/partnership/onboarding`

Demo boundary:

- Organization and school flows are frontend/demo surfaces.
- Production multi-tenant backend, school admin backend, CRM, and enterprise billing are not implemented.

### 2.9 Information Architecture and UX Structure

Implemented:

- complete page inventory
- route map
- role-based navigation architecture
- user journey documentation
- page entry/exit audit
- orphan page audit
- duplicate page audit
- route and navigation configuration
- breadcrumb, back button, and page action helpers
- layout guidelines
- CTA hierarchy guidelines
- mobile navigation guidelines
- final demo flow

Key docs:

- `docs/ia/page-inventory.md`
- `docs/ia/route-map.md`
- `docs/ia/navigation-architecture.md`
- `docs/ia/user-journeys.md`
- `docs/ia/page-entry-exit-audit.md`
- `docs/ia/orphan-page-audit.md`
- `docs/ia/duplicate-page-audit.md`
- `docs/ux/layout-guidelines.md`
- `docs/ux/cta-guidelines.md`
- `docs/ux/mobile-navigation.md`
- `docs/demo/final-demo-flow.md`

### 2.10 Demo Backend and Backend Integration Readiness

Implemented:

- local FastAPI demo backend
- SQLite-backed local demo state
- fixed demo accounts
- resettable seed data
- health endpoint
- auth endpoints
- conversation/message endpoints
- mock streaming endpoint
- teacher-help and tutor endpoints
- parent report endpoints
- billing/referral/support/admin demo endpoints
- consistent demo error response shape
- frontend API mode configuration
- real backend readiness document
- AWS readiness notes
- demo backend QA checklist

Key backend files:

- `backend/app/main.py`
- `backend/app/database.py`
- `backend/app/seed.py`
- `backend/app/reset_demo_data.py`

Key docs:

- `docs/demo-backend/demo-backend-scope.md`
- `docs/demo-backend/demo-api-contract.md`
- `docs/demo-backend/demo-data.md`
- `docs/demo-backend/demo-reset-flow.md`
- `docs/backend-integration/real-backend-readiness.md`
- `docs/backend-integration/aws-readiness-notes.md`
- `docs/qa/demo-backend-qa.md`

## 3. What Is Not Implemented

The current repository intentionally does not implement:

- production authentication
- password reset completion
- refresh-token architecture
- production database schema
- production multi-tenant backend
- real AI provider orchestration
- real AI diagnosis or curriculum graph computation
- real payment checkout
- Stripe webhook processing
- real subscription enforcement
- production analytics warehouse
- production support tooling
- AWS deployment
- final legal/compliance package

These are future backend, infrastructure, or quality-hardening milestones.

## 4. Local Setup

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Environment Configuration

Use demo mode for local full-flow demos:

```bash
VITE_API_MODE=demo
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_MSW=false
VITE_ENABLE_DEMO_API=true
```

Common API modes:

| Mode | Use |
|------|-----|
| `mock` | Frontend-only mocked behavior. |
| `demo` | Local demo backend at `http://localhost:8000`. |
| `staging` | Future staging backend. Demo fallback should be disabled. |
| `production` | Future production backend. Demo fallback should be disabled. |

### 4.3 Reset Demo Data

Run this before demos when you want a clean state:

```bash
npm run demo:reset
```

This restores:

- fixed demo accounts
- parent-child link
- conversations and messages
- uploaded file metadata
- learning history
- teacher-help requests
- parent reports
- support tickets
- feedback
- billing interest
- admin demo data

### 4.4 Start Demo Backend

```bash
npm run demo:backend
```

Expected backend URL:

```text
http://localhost:8000
```

Health check:

```text
GET http://localhost:8000/health
```

Expected response:

```json
{
  "ok": true,
  "service": "stoa-demo-backend",
  "mode": "demo"
}
```

### 4.5 Start Frontend

In another terminal:

```bash
npm run dev
```

Expected frontend URL:

```text
http://localhost:5173/
```

## 5. Recommended Demo Flow

### 5.1 Public and Pricing Entry

1. Open `/for-parents`.
2. Explain the parent-facing value proposition.
3. Navigate to `/pricing`.
4. Show the available plan cards.
5. Avoid describing checkout as real payment.

### 5.2 Student Flow

1. Log in with `student@test.com / password123`.
2. Confirm the app lands on `/dashboard`.
3. Open `/chat`.
4. Open an existing conversation or create a new one.
5. Send a homework-style question.
6. Show the deterministic demo AI response.
7. Request teacher help.
8. Mention that real AI and real teacher routing are future backend responsibilities.

Useful routes:

- `/dashboard`
- `/chat`
- `/learning-history`
- `/profile`

### 5.3 Tutor Flow

1. Log out or switch user.
2. Log in with `tutor@test.com / password123`.
3. Open `/tutor`.
4. Show pending and assigned requests.
5. Open a request detail.
6. Update request status, for example to `in_progress` or `resolved`.
7. Add a tutor note if useful for the demo.

Useful routes:

- `/tutor`
- `/tutor/requests/:requestId`
- `/tutor/availability`

### 5.4 Parent Flow

1. Log out or switch user.
2. Log in with `parent@test.com / password123`.
3. Open `/parent`.
4. Select Anna Keller.
5. Open weekly report.
6. Open monthly report placeholder.
7. Continue to billing.
8. Open referral or support if needed.

Useful routes:

- `/parent`
- `/parent/children/user-student`
- `/parent/children/user-student/report`
- `/parent/children/user-student/monthly-report`
- `/billing`
- `/referrals`
- `/support`

### 5.5 Billing and Mock Checkout

1. Open `/billing`.
2. Show subscription status and usage quota.
3. Select a plan.
4. Trigger mock checkout.
5. Confirm the flow returns to a local success route.

Important boundary:

- This is not real Stripe checkout.
- No card details are collected.
- Webhooks are not implemented.

### 5.6 Support and Feedback

1. Open `/support`.
2. Submit a support request.
3. Open `/support/tickets`.
4. Open the created ticket.

Admin can later inspect support tickets under:

- `/admin/support`
- `/admin/support/:ticketId`

### 5.7 Admin Flow

1. Log out or switch user.
2. Log in with `admin@test.com / password123`.
3. Open `/admin`.
4. Show usage summary, help requests, support inbox, feedback, billing interest, and analytics.

Useful routes:

- `/admin`
- `/admin/usage`
- `/admin/help-requests`
- `/admin/support`
- `/admin/feedback`
- `/admin/billing-interest`
- `/admin/analytics`

### 5.8 Optional Organization Demo

Use this only after the core student-parent-tutor-admin path is shown:

1. Open `/organization`.
2. Show organization dashboard.
3. Open students, tutors, reports, or analytics.
4. Open advanced learning profile from organization/student context.

Useful routes:

- `/organization`
- `/organization/students`
- `/organization/tutors`
- `/organization/reports`
- `/organization/analytics`
- `/students/student-anna/learning-profile`

## 6. Demo Backend API Summary

Core endpoints:

- `GET /health`
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `GET /conversations`
- `GET /conversations/:conversationId`
- `POST /conversations`
- `POST /conversations/:conversationId/messages`
- `POST /conversations/:conversationId/messages/stream`
- `POST /teacher-help/request`
- `GET /teacher-help/request/:requestId`
- `GET /tutors/me/help-requests`
- `GET /tutors/me/help-requests/:requestId`
- `PATCH /tutors/me/help-requests/:requestId`
- `GET /parents/me/children`
- `GET /parents/me/children/:childId/summary`
- `GET /parents/me/children/:childId/history`
- `GET /parents/me/children/:childId/report`
- `GET /parents/me/children/:childId/monthly-report`
- `GET /billing/plans`
- `GET /billing/subscription`
- `GET /billing/usage`
- `GET /billing/feature-access`
- `POST /billing/checkout-session`
- `GET /referrals/me`
- `POST /feedback`
- `POST /support/requests`
- `POST /support/tickets`
- `GET /support/tickets`
- `GET /support/tickets/:ticketId`
- `GET /admin/analytics/overview`
- `GET /admin/support/tickets`
- `PATCH /admin/support/tickets/:ticketId`
- `GET /admin/help-requests`
- `GET /admin/feedback`
- `GET /admin/usage-summary`
- `GET /admin/users`
- `GET /admin/billing-interest`
- `GET /admin/system-status`

Demo errors use:

```json
{
  "message": "Invalid demo credentials",
  "code": "DEMO_INVALID_CREDENTIALS"
}
```

## 7. Verification Commands

Use these before important demos or handoffs:

```bash
python3 -m py_compile backend/app/*.py
```

```bash
npm run demo:reset
```

```bash
npx tsc -b --pretty false
```

```bash
npm run lint
```

```bash
npm run build
```

Current known build notes:

- Vite may warn that some chunks are larger than 500 kB.
- Node may show a deprecation warning for `module.register()`.
- These warnings existed at Phase 14 closure and did not block the build.

## 8. Common Troubleshooting

### Frontend Cannot Load Data

Check:

1. Is the demo backend running?
2. Does `GET http://localhost:8000/health` return `ok: true`?
3. Is `VITE_API_BASE_URL=http://localhost:8000`?
4. Is `VITE_API_MODE=demo`?

### Login Fails

Run:

```bash
npm run demo:reset
```

Then use one of the fixed demo accounts.

### Demo State Looks Messy

Run:

```bash
npm run demo:reset
```

This clears temporary demo-session changes and restores seed data.

### Mock Data Appears Unexpectedly

Check:

```bash
VITE_ENABLE_DEMO_API=true
```

Demo fallback should be enabled only for local demo/mock use. For staging or production-like testing, set:

```bash
VITE_ENABLE_DEMO_API=false
```

### Checkout Confusion

The checkout flow is virtual/mock only. It returns local success/cancel URLs and does not connect to Stripe.

## 9. Documentation Map

Use these docs for deeper context:

| Topic | Document |
|-------|----------|
| Final demo flow | `docs/demo/final-demo-flow.md` |
| Demo backend scope | `docs/demo-backend/demo-backend-scope.md` |
| Demo API contract | `docs/demo-backend/demo-api-contract.md` |
| Demo data | `docs/demo-backend/demo-data.md` |
| Demo reset | `docs/demo-backend/demo-reset-flow.md` |
| Real backend readiness | `docs/backend-integration/real-backend-readiness.md` |
| AWS readiness | `docs/backend-integration/aws-readiness-notes.md` |
| Demo backend QA | `docs/qa/demo-backend-qa.md` |
| Route map | `docs/ia/route-map.md` |
| Navigation architecture | `docs/ia/navigation-architecture.md` |
| User journeys | `docs/ia/user-journeys.md` |
| Page inventory | `docs/ia/page-inventory.md` |

## 10. Recommended Demo Script

Short version:

1. Reset demo data.
2. Start backend.
3. Start frontend.
4. Open parent landing and pricing.
5. Log in as student.
6. Ask a question in chat.
7. Request teacher help.
8. Log in as tutor.
9. Resolve the request.
10. Log in as parent.
11. Review child report and billing.
12. Submit support or referral flow.
13. Log in as admin.
14. Review analytics, help requests, support, and feedback.

The strongest current story is:

```text
Student asks for help
  -> AI gives demo response
  -> student requests tutor support
  -> tutor handles the request
  -> parent sees learning visibility
  -> billing/referral/support/admin flows demonstrate operational readiness
```

## 11. Current Product Boundary

The project currently demonstrates a credible STOA product direction and frontend architecture. It should be presented as:

- a runnable frontend foundation
- a role-based product demo
- a stable local demo backend
- a backend API contract reference
- a readiness bridge for formal backend and AWS integration

It should not be presented as:

- a production backend
- a production auth system
- a live payment system
- a real AI diagnosis engine
- a deployed AWS architecture
- a complete school/enterprise platform backend
