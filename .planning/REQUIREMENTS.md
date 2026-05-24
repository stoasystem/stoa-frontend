# Requirements: STOA Frontend v1.5 Phase 6 Authentication, User Roles, and Parent Visibility

**Defined:** 2026-05-24
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## v1.5 Requirements

Requirements for the sixth-stage authentication, role, parent visibility, tutor help-request, and local SQLite testing milestone. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can register with name, email, password, and role.
- [ ] **AUTH-02**: User can log in with email and password.
- [ ] **AUTH-03**: User session persists across refresh using `stoa_access_token`.
- [ ] **AUTH-04**: User can log out and clear local auth state.
- [ ] **AUTH-05**: Frontend loads current user from `/auth/me`.
- [ ] **AUTH-06**: 401 responses clear auth and redirect to `/login`.
- [ ] **AUTH-07**: 403 responses redirect to `/forbidden` without clearing auth.

### Roles and Routing

- [ ] **ROLE-01**: App supports `student`, `parent`, `tutor`, and `admin` user roles.
- [ ] **ROLE-02**: Unauthenticated users cannot access protected routes.
- [ ] **ROLE-03**: Users cannot access routes outside their role.
- [ ] **ROLE-04**: Login and register redirect users to the correct role dashboard.
- [ ] **ROLE-05**: App layout shows role-specific navigation and user menu.

### Student

- [ ] **STUD-01**: Student can access dashboard, chat, profile, and learning history.
- [ ] **STUD-02**: Student can view and update grade, school system, and primary subjects.
- [ ] **STUD-03**: Student can view their own learning history.
- [ ] **STUD-04**: Student chat and conversation data is scoped to the current user.

### Parent

- [ ] **PARN-01**: Parent can view bound children.
- [ ] **PARN-02**: Parent can view child learning summary.
- [ ] **PARN-03**: Parent can view child recent questions and weak topics.
- [ ] **PARN-04**: Parent can view child teacher-help records.
- [ ] **PARN-05**: Parent can view child learning-history summaries.
- [ ] **PARN-06**: Parent cannot directly participate in child chat.

### Tutor

- [ ] **TUTR-01**: Tutor can view help requests by status.
- [ ] **TUTR-02**: Tutor can open help-request detail with question context.
- [ ] **TUTR-03**: Tutor can update request status.
- [ ] **TUTR-04**: Tutor only receives permitted help-request data.

### Local Backend and SQLite

- [ ] **BACK-01**: Local FastAPI backend exposes the Phase 6 API contract.
- [ ] **BACK-02**: SQLite stores users, profiles, parent-child links, conversations, messages, uploads metadata, attachments, teacher help requests, and learning history.
- [ ] **BACK-03**: Seed script creates student, parent, tutor, and admin accounts.
- [ ] **BACK-04**: Backend hashes passwords and issues bearer access tokens.
- [ ] **BACK-05**: Backend enforces 401 and 403 behavior.
- [ ] **BACK-06**: Backend filters student, parent, and tutor data by current user and role.
- [ ] **BACK-07**: Conversation, message, teacher-help, and learning-history data can be saved to SQLite.

### Documentation and Verification

- [ ] **DOCS-19**: README documents Phase 6 auth, roles, routes, endpoints, token storage, SQLite, and seed accounts.
- [ ] **VERF-01**: `npm install`, `npm run dev`, and `npm run build` are verified or any environment limitation is recorded.
- [ ] **VERF-02**: Student, parent, tutor, admin, protected-route, role-route, and SQLite-backed API flows are manually verified.

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Authentication Hardening

- **AUTH-08**: User can complete email verification.
- **AUTH-09**: User can reset password through a secure email flow.
- **AUTH-10**: Production auth uses a hardened token strategy such as httpOnly cookies or refresh tokens.
- **AUTH-11**: Production SSO can be integrated.

### Parent, Tutor, and Admin Expansion

- **PARN-07**: Parent can invite or bind children through a real invitation workflow.
- **TUTR-05**: Tutor can participate in live multi-person teacher chat.
- **ADMN-01**: Admin can manage users, tutors, roles, and platform content.
- **ORG-01**: Schools and organization structures can be modeled.

### Product Readiness

- **ANLY-01**: Product analytics and usage tracking exist.
- **RPRT-01**: Parent report generation exists.
- **COMP-01**: Audit logging and compliance documentation are production-ready.
- **DEPLOY-01**: Staging and production deployment workflows exist.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Production SSO | Phase 6 validates core auth and role boundaries first. |
| Complete email verification | Registration can work locally without full email infrastructure. |
| Complete password reset | Deferred until production auth hardening. |
| Refresh-token/httpOnly-cookie migration | Phase 6 uses `localStorage` for MVP validation and documents the limitation. |
| Complex school organization | Not required for first role-boundary validation. |
| Parent invitation workflow | Seeded parent-child links are enough for Phase 6. |
| Live tutor chat | Tutor list/detail/status is enough for Phase 6. |
| Full admin management | Admin route remains a placeholder. |
| Payment system | Deferred until product and auth flows mature. |
| Production SQLite | SQLite is local test infrastructure only. |
| Direct frontend model API calls | The frontend must remain decoupled from model providers. |
| Full audit logging and compliance documentation | Deferred to later security/compliance milestones. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 21 | Pending |
| AUTH-02 | Phase 21 | Pending |
| AUTH-03 | Phase 21 | Pending |
| AUTH-04 | Phase 21 | Pending |
| AUTH-05 | Phase 21 | Pending |
| AUTH-06 | Phase 21 | Pending |
| AUTH-07 | Phase 21 | Pending |
| ROLE-01 | Phase 21 | Pending |
| ROLE-02 | Phase 21 | Pending |
| ROLE-03 | Phase 21 | Pending |
| ROLE-04 | Phase 21 | Pending |
| ROLE-05 | Phase 27 | Pending |
| BACK-01 | Phase 22 | Pending |
| BACK-02 | Phase 22 | Pending |
| BACK-03 | Phase 22 | Pending |
| BACK-04 | Phase 22 | Pending |
| BACK-05 | Phase 22 | Pending |
| BACK-06 | Phase 22 | Pending |
| BACK-07 | Phase 22 | Pending |
| STUD-01 | Phase 23 | Pending |
| STUD-02 | Phase 23 | Pending |
| STUD-03 | Phase 23 | Pending |
| STUD-04 | Phase 23 | Pending |
| PARN-01 | Phase 24 | Pending |
| PARN-02 | Phase 24 | Pending |
| PARN-03 | Phase 24 | Pending |
| PARN-04 | Phase 24 | Pending |
| PARN-05 | Phase 24 | Pending |
| PARN-06 | Phase 24 | Pending |
| TUTR-01 | Phase 25 | Pending |
| TUTR-02 | Phase 25 | Pending |
| TUTR-03 | Phase 25 | Pending |
| TUTR-04 | Phase 25 | Pending |
| DOCS-19 | Phase 27 | Pending |
| VERF-01 | Phase 27 | Pending |
| VERF-02 | Phase 27 | Pending |

**Coverage:**
- v1.5 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after v1.5 initialization*
