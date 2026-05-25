# Phase 13 Manual QA Checklist

## Page Inventory

- [ ] All routes in `src/app/router/AppRouter.tsx` are represented in `docs/ia/page-inventory.md`.
- [ ] Every inventory entry has role, module, status, priority, entry points, and exit points.
- [ ] Legacy unmounted page components are documented.

## Navigation

- [ ] Student nav shows Dashboard, Chat, Learning History, Profile.
- [ ] Parent nav shows Overview, Reports, Billing, Referrals, Support.
- [ ] Tutor nav shows Requests, Availability, Support.
- [ ] Admin nav prioritizes Overview, Learning Activity, Help Requests, Support Inbox.
- [ ] Organization nav appears for organization roles and does not appear for student/parent/tutor.
- [ ] Demo/advanced pages are hidden from primary nav.
- [ ] Active nav styling appears on current route.

## Page Flow

- [ ] Student can reach Chat from Dashboard/nav and return via navigation.
- [ ] Parent can open child summary, weekly report, monthly report, billing, and support without manual URLs.
- [ ] Tutor can open request detail and return to Requests.
- [ ] Admin can open support ticket detail and return to Support Inbox.
- [ ] Organization can open Students and a learning profile.

## Breadcrumbs and Back Buttons

- [ ] Parent child summary/report pages show breadcrumb or back action.
- [ ] Tutor request detail shows `Requests` return action.
- [ ] Support ticket details show support breadcrumbs.
- [ ] Learning profile, diagnosis, and graph have return paths.

## Mobile

- [ ] Mobile student nav is usable on `/dashboard` and `/chat`.
- [ ] Mobile parent nav is usable on `/parent` and report pages.
- [ ] Mobile tutor nav is usable on `/tutor` and request detail.
- [ ] Admin/organization mobile pages remain scannable.
- [ ] Fixed mobile nav does not cover chat input or critical form actions.

## Demo Flow

- [ ] `docs/demo/final-demo-flow.md` can be followed without direct URL entry after the first page.
- [ ] Demo pages clearly distinguish mock/virtual behavior from production behavior.
- [ ] Demo does not rely on hidden placeholder pages.

## Build

- [ ] `npm install` or existing dependency state is verified.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] E2E or route smoke coverage is updated where feasible.
