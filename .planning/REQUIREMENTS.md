# Requirements: STOA Frontend

**Defined:** 2026-05-25
**Milestone:** v1.14 Phase 15: Homepage Redesign, Onboarding Flow, and Premium UI Refinement
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, and a clean path to future real backend integration.

## v1.14 Requirements

Requirements for Phase 15. Each requirement maps to exactly one roadmap phase.

### Homepage and Navigation

- [x] **HOME-01**: User can land on a magazine-style homepage that immediately presents STOA as a premium student learning platform.
- [x] **HOME-02**: User can click a single primary `Start Learning` CTA that starts the student learning path.
- [x] **HOME-03**: Homepage no longer presents `AI Support`, `Teacher Backup`, and `Parent Visibility` as three parallel primary product entries.
- [x] **HOME-04**: Homepage explains STOA as a sequential learning flow: ask a question, get an AI explanation, ask a teacher if needed, and let parents follow progress.
- [x] **HOME-05**: Marketing navigation gives student learning the highest priority while keeping parent/tutor/login/pricing entry points available at lower visual weight.
- [x] **HOME-06**: Homepage mobile layout shows brand, primary CTA, and a hint of the next section without text or image overlap.

### Auth and Onboarding

- [x] **AUTH-01**: Unauthenticated users who click `Start Learning` are routed to `/login?next=/chat`.
- [x] **AUTH-02**: Login page exposes a clear path to create an account.
- [x] **AUTH-03**: Registration flow starts with role selection for `student`, `parent`, and `tutor`; public admin registration is not offered.
- [x] **AUTH-04**: Student registration collects age, school, grade, optional school system, subjects needing help, parent name, and parent email.
- [x] **AUTH-05**: Parent registration collects child name, child age or grade, child school, and subjects needing help.
- [x] **AUTH-06**: Tutor registration collects subjects, education background, years of teaching experience, short introduction, and credential file references.
- [x] **AUTH-07**: Tutor registration supports PDF, PNG, and JPEG credential upload UI with a 10 MB limit and pending-review messaging.
- [x] **AUTH-08**: Registration completion routes users by role to `/chat`, `/parent`, or `/tutor`.

### AI-First Chat

- [x] **CHAT-01**: Student can enter `/chat` and ask a homework question directly without choosing an `AI Support` module.
- [x] **CHAT-02**: Chat empty state uses first-question guidance and a homework-focused input placeholder.
- [x] **CHAT-03**: Assistant responses show an inline teacher escalation action after the AI answer.
- [x] **CHAT-04**: Teacher escalation copy is framed as a user action such as `Ask a human tutor`, not as a separate `Teacher Backup` product module.
- [x] **CHAT-05**: Created teacher-help requests remain compatible with existing tutor and parent demo flows.

### Demo Backend and API Contracts

- [x] **API-01**: `POST /auth/register` accepts role-specific `profile` payloads for student, parent, and tutor onboarding.
- [x] **API-02**: Student registration response can include `parentLinked: true` for demo parent-link behavior.
- [x] **API-03**: Tutor registration response can include `verificationStatus: pending_review`.
- [x] **API-04**: `POST /files/tutor-credentials` accepts mock PDF, PNG, and JPEG uploads and returns uploaded file metadata.
- [x] **API-05**: Demo reset preserves fixed demo accounts while clearing temporary registration/upload changes.

### Premium UI, QA, and Documentation

- [x] **UI-01**: Homepage, login, register, and chat share a premium visual language using deep navy, warm ivory, muted sage, soft gold accents, and restrained surfaces.
- [x] **UI-02**: CTAs, cards, input focus states, and interactive controls have subtle transitions that do not harm mobile usability.
- [x] **QA-01**: Phase 15 README and demo documentation explain the redesigned homepage, onboarding flow, AI-first chat path, and demo backend behavior.
- [x] **QA-02**: QA checklist covers homepage, onboarding roles, tutor credential upload, chat escalation, demo backend reset, and mobile checks.
- [x] **QA-03**: `npm run build` passes after Phase 15 changes.

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Phase 16 Design System and Accessibility

- **DS-01**: Team can review component documentation for Button, Card, Form, Table, Badge, layout primitives, and shared state components.
- **DS-02**: Team can review a consolidated token system for colors, typography, spacing, borders, shadows, and motion.
- **A11Y-01**: App has accessibility audit coverage for keyboard navigation, screen reader labels, focus states, and color contrast.
- **QA-UI-01**: App has visual regression or screenshot comparison coverage for major route surfaces.

### Production Backend

- **BACKEND-01**: Formal backend implements production authentication, authorization, persistence, AI orchestration, payment webhooks, subscription enforcement, analytics storage, support workflows, admin operations, parent invitations, and tutor verification.
- **AWS-01**: Production infrastructure deploys through a separately planned backend/cloud milestone.

## Out of Scope

Explicitly excluded from v1.14 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Formal production backend | Phase 15 only extends demo contracts needed by onboarding and chat demos. |
| Real identity, parent, or tutor verification | Credential upload is mock onboarding UI and cannot imply real approval. |
| Certificate OCR or document review workflow | Requires backend, storage, operations, and security scope outside this milestone. |
| Production authentication redesign | Current demo auth flow remains enough for frontend demonstration. |
| Real payment system expansion | Phase 15 is homepage/onboarding/chat refinement, not billing expansion. |
| Broad feature expansion | The milestone fixes first impression and core path rather than adding new product modules. |
| Full design-system rewrite | Phase 16 is reserved for design system hardening and accessibility. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOME-01 | Phase 87 | Complete |
| HOME-02 | Phase 87 | Complete |
| HOME-03 | Phase 87 | Complete |
| HOME-04 | Phase 87 | Complete |
| HOME-05 | Phase 87 | Complete |
| HOME-06 | Phase 87 | Complete |
| UI-01 | Phase 87 | Complete |
| UI-02 | Phase 87 | Complete |
| API-01 | Phase 88 | Complete |
| API-02 | Phase 88 | Complete |
| API-03 | Phase 88 | Complete |
| API-04 | Phase 88 | Complete |
| API-05 | Phase 88 | Complete |
| AUTH-03 | Phase 89 | Complete |
| AUTH-04 | Phase 89 | Complete |
| AUTH-05 | Phase 89 | Complete |
| AUTH-06 | Phase 89 | Complete |
| AUTH-07 | Phase 89 | Complete |
| AUTH-08 | Phase 89 | Complete |
| AUTH-01 | Phase 89 | Complete |
| AUTH-02 | Phase 89 | Complete |
| CHAT-01 | Phase 90 | Complete |
| CHAT-02 | Phase 90 | Complete |
| CHAT-03 | Phase 90 | Complete |
| CHAT-04 | Phase 90 | Complete |
| CHAT-05 | Phase 90 | Complete |
| QA-01 | Phase 91 | Complete |
| QA-02 | Phase 91 | Complete |
| QA-03 | Phase 91 | Complete |

**Coverage:**
- v1.14 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 at Phase 15 planning*
