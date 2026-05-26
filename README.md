# STOA Frontend

STOA learning platform frontend.

## Tech Stack

- React
- TypeScript
- Vite
- npm

## Phase 25 Local Codex Provider Integration

This phase connects Codex as a local demo provider for the Learning Assistant.

This is only for local testing and public demo preparation. It is not the production AI backend.

Goals:

- Use Codex through a Python prompt harness.
- Keep the frontend calling the same Chat API.
- Guide students instead of giving final answers first.
- Respect student grade level and selected subjects.
- Suggest professional teacher support when needed.
- Hide Codex, model, provider, prompt, backend, demo, and mock details from user-facing UI.
- Use a template fallback provider if Codex is unavailable.

Environment:

```bash
STOA_DEMO_PROVIDER=codex
STOA_DEMO_PROVIDER_FALLBACK=template
STOA_DEMO_PROVIDER_TIMEOUT_SECONDS=60
STOA_DEMO_LANGUAGE_DEFAULT=en
VITE_API_MODE=demo
VITE_API_BASE_URL=http://localhost:8000
VITE_SHOW_INTERNAL_DEBUG=false
```

Local provider QA:

```bash
python3 -m unittest discover -s demo-harness/tests
npm run demo:reset
npm run demo:backend
npm run build
```

User-facing UI must never mention Codex.

Phase 25 docs:

- `docs/qa/codex-provider-behavior-qa.md`
- `docs/backend-integration/learning-provider-handoff.md`

## Phase 26 Learning Assistant Functional QA

This phase tests and stabilizes the Learning Assistant behavior. It does not add product features or redesign the UI.

The goal is to ensure that the Learning Assistant:

- answers relevantly
- does not give final answers first for homework-style questions
- guides students step by step
- respects student grade level
- respects selected subjects
- redirects unrelated questions outside the learning profile
- suggests professional teacher support when appropriate
- avoids internal terms such as Codex, AI, model, prompt, demo, backend, mock, provider, and system instruction
- remains stable in multi-turn conversations

Run regression tests:

```bash
python3 -m unittest discover -s demo-harness/tests
npm run lint
npm run build
```

Phase 26 docs:

- `docs/qa/learning-assistant-functional-qa-plan.md`
- `docs/qa/learning-assistant-regression-report.md`
- `docs/learning-assistant/relevance-rules.md`
- `docs/learning-assistant/multi-turn-behavior-rules.md`
- `docs/learning-assistant/repair-prompt-rules.md`
- `docs/learning-assistant/demo-readiness-threshold.md`

## Phase 27 Practice Path Integration

This phase integrates a Duolingo-style practice flow into the STOA learning platform.

Reference:

- https://github.com/sanidhyy/duolingo-clone

Scope:

- Frontend design and integration only
- Practice overview
- Subject learning path
- Lesson page
- Challenge feedback
- Hint flow
- Lesson result page
- Dashboard practice summary
- Parent report practice summary
- Mock API support

We do not copy the full project backend, database, payment system, or visual style.

STOA adapts the idea into a premium education-oriented Practice Path.

Phase 27 docs:

- `docs/practice/duolingo-clone-reference-audit.md`
- `docs/practice/practice-module-scope.md`
- `docs/practice/practice-api-contract.md`
- `docs/practice/practice-ui-guidelines.md`
- `docs/practice/practice-demo-data.md`
- `docs/practice/practice-functional-qa.md`

## Phase 28 Practice Path QA and Equation Demo Content

This phase refines the Practice Path demo content.

For the demo stage, the Practice Path focuses only on equations:

- Linear equations in one variable
- Quadratic equations
- Linear systems in two variables

The goal is not to build a full math curriculum yet.

The goal is to create a clear, stable, and educational demo path that shows how STOA can guide students through short practice lessons.

Main tasks:

- Check lesson content quality
- Adjust challenge difficulty
- Improve feedback and hint copy
- Test Learning Assistant behavior inside Practice
- Improve Parent Report practice summary
- Polish the demo scenario

## Phase 29 Practice Path Interaction and Learning Entry Flow

This phase refines how the Practice Path fits into the wider STOA learning platform.

The goal is not to add more curriculum content.

The goal is to make the existing equation demo smoother and make Practice a natural entry into Learning Chat:

- Lesson intro before challenges
- Stable challenge, feedback, hint, retry, and result flow
- Practice context handoff into Learning Chat
- Chat context card for practice steps
- Back to lesson flow
- Teacher support only after repeated confusion
- Student Dashboard entry points for Continue Practice and Ask a question
- Homepage learning entry copy that does not make Practice and Chat compete
- Parent Report learning activity summary across practice, questions, mistakes, and teacher support

Phase 29 remains frontend design, route state, mock contract, docs, and demo QA only. It does not add a production backend, real adaptive learning, broader curriculum, or game-first reward systems.

## Phase 30 Final Demo Curriculum Packaging and Product Story

This phase packages the existing Practice Path, Learning Chat, teacher support, and Parent Report flow into a final external demo curriculum story.

The final demo curriculum remains focused on equations:

- Linear equations in one variable
- Quadratic equations
- Linear systems in two variables

The goal is not to add more functionality or curriculum breadth.

The goal is to make the existing demo clear enough for external students, parents, tutors, stakeholders, and investors to understand:

- Students can practise step by step.
- Mistakes lead to hints before full explanations.
- `Explain this step` opens Learning Chat with the practice context.
- Professional teacher support is available when guided help is not enough.
- Parents can understand the learning activity through a clear report.

Main deliverables:

- Final equation demo curriculum package
- Product story and 3/10/15 minute demo scripts
- Student, parent, tutor, and stakeholder testing task sheets
- Feedback form and evaluation framework
- Parent value framing
- Future curriculum and backend handoff requirements
- Phase 31 follow-up backlog

Phase 30 remains documentation, demo packaging, external testing preparation, and verification only. It does not add new product surfaces, production backend/database work, a content CMS, formal teacher scheduling, payment systems, adaptive learning, or a broad curriculum library.

Phase 30 docs:

- `docs/curriculum/final-demo-curriculum-package/overview.md`
- `docs/demo/final-demo-curriculum-package/product-story.md`
- `docs/demo/final-demo-curriculum-package/integrated-practice-chat-parent-demo-script.md`
- `docs/testing/external-practice-demo-testing-plan.md`
- `docs/feedback/practice-demo-feedback-form.md`
- `docs/parent/practice-chat-parent-value-framing.md`
- `docs/backend-integration/practice-real-backend-requirements.md`
- `docs/backlog/phase31-practice-demo-follow-up-backlog.md`

## Phase 23 Launch Candidate Bug Fixing and Public Demo Release

This phase does not add new features.

It fixes launch-candidate blockers, completes final approval, and prepares the public demo release.

Main tasks:

- Fix P0 / P1 launch candidate bugs
- Complete final approval changes
- Rerun final demo flow
- Run multilingual smoke test
- Run responsive smoke test
- Run accessibility smoke test
- Prepare deployment handoff
- Prepare demo monitoring plan
- Prepare first external presentation support
- Publish public demo release notes
- Complete Go / No-Go decision

Rule:

No new feature development is allowed in this phase.

Phase 23 docs:

- `docs/release/final-approval-changes.md`
- `docs/release/phase-23-lock-preservation.md`
- `docs/release/public-demo-final-run.md`
- `docs/release/deployment-handoff.md`
- `docs/release/demo-monitoring-plan.md`
- `docs/release/first-external-presentation-support.md`
- `docs/release/public-demo-release-notes.md`
- `docs/release/go-no-go-decision.md`
- `docs/release/public-demo-release-confirmation.md`

Verification:

```bash
npm run demo:reset
npm run demo:backend
npm run dev -- --host 127.0.0.1
npm run lint
npm run build
```

## Phase 22 Final Demo Package and Launch Candidate

This phase does not add new features.

It packages the STOA Learning Platform frontend into a stable launch candidate for review and demo.

Main tasks:

- Final demo package
- Investor demo script
- Parent demo script
- Student demo script
- Tutor demo script
- Admin demo script
- Stakeholder review checklist
- Final bug triage
- Final copy lock
- Final design lock
- Final translation lock
- Final demo API contract lock
- Launch candidate branch
- Release notes
- Known issues list
- Launch candidate approval

Launch candidate rule:

After the launch candidate branch is created, only bug fixes are allowed. New features must go into the next-stage backlog.

Phase 22 docs:

- `docs/demo/final-demo-package/demo-overview.md`
- `docs/demo/final-demo-package/investor-demo-script.md`
- `docs/demo/final-demo-package/parent-demo-script.md`
- `docs/demo/final-demo-package/student-demo-script.md`
- `docs/demo/final-demo-package/tutor-demo-script.md`
- `docs/demo/final-demo-package/admin-demo-script.md`
- `docs/demo/final-demo-package/demo-accounts.md`
- `docs/demo/final-demo-package/demo-data-reset.md`
- `docs/demo/final-demo-package/demo-known-limitations.md`
- `docs/demo/final-demo-package/demo-troubleshooting.md`
- `docs/demo/final-demo-run-result.md`
- `docs/review/stakeholder-review-checklist.md`
- `docs/release/final-bug-triage.md`
- `docs/release/final-copy-lock.md`
- `docs/release/final-design-lock.md`
- `docs/release/final-translation-lock.md`
- `docs/release/final-demo-api-contract-lock.md`
- `docs/release/release-notes-lc1.md`
- `docs/release/known-issues.md`
- `docs/release/next-stage-backlog.md`
- `docs/release/launch-candidate-approval.md`

Verification:

```bash
npm install --ignore-scripts
npm run demo:reset
npm run demo:backend
npm run dev -- --host 127.0.0.1
npm run lint
npm run build
```

## Phase 21 Accessibility, Brand Details, and Release Quality Gate

Phase 21 prepares STOA Frontend for release-candidate review without adding broad business scope. It integrates read-only brand details from the company homepage, adds a real contact surface, improves accessibility foundations, and records QA/release gates.

Source reference:

```text
/Users/zhdeng/newweb
```

Important rule:

Do not modify anything inside `/Users/zhdeng/newweb`. Phase 21 only reads company homepage footer, logo, and contact-form patterns, then reimplements suitable details inside the learning platform.

Main updates:

- Footer now includes STOA contact facts: `info@stoaedu.ch`, `+41 78 332 37 96`, and `Zürich · Schindellegi (SZ) · Würenlos (AG)`.
- `StoaLogo` provides platform-theme logo variants without copying homepage assets.
- `/contact` provides a multilingual contact form for parents, students, teachers, schools, and other requests.
- `POST /contact/requests` is documented and supported by the local demo backend contract.
- Login, register, chat, support, and contact received targeted accessibility hardening.
- Playwright E2E runs in deterministic frontend demo QA mode and passes 12 smoke tests.
- Release quality gate and final pre-launch checklist are documented.

Phase 21 docs:

- `docs/brand/main-website-brand-details.md`
- `docs/brand/footer-contact-integration.md`
- `docs/brand/logo-adaptation.md`
- `docs/brand/contact-form-adaptation.md`
- `docs/accessibility/accessibility-audit.md`
- `docs/accessibility/keyboard-navigation.md`
- `docs/accessibility/screen-reader-smoke-test.md`
- `docs/accessibility/color-contrast-audit.md`
- `docs/qa/cross-browser-qa.md`
- `docs/qa/mobile-device-qa.md`
- `docs/qa/visual-regression-testing.md`
- `docs/qa/performance-sanity-check.md`
- `docs/release/release-quality-gate.md`
- `docs/release/final-pre-launch-checklist.md`

Verification:

```bash
npm install --ignore-scripts
npm run dev -- --host 127.0.0.1
npm run build
npm run test:e2e
```

Manual gates still required before launch candidate:

- Safari, Firefox, Edge, Mobile Safari, and Android Chrome QA.
- Real screen-reader smoke test.
- Rendered color contrast audit.
- Screenshot visual-regression baselines if the team wants PNG snapshots committed.

## Phase 20 Cross-Locale Copy Refinement

Phase 20 refines English, German, French, and Italian copy across the STOA learning platform and adapts layout where language length affects UI fit. The goal is natural local product copy, not literal translation.

Source reference:

```text
/Users/zhdeng/newweb
```

Important rule:

Do not modify anything inside `/Users/zhdeng/newweb`. The company homepage is read-only for this phase and may only be used to study German writing style.

Main goals:

- Learn from the German writing style of the company homepage without copying its components or long text blocks.
- Improve German copy so it reads like STOA-native German, not direct English translation.
- Keep English calm, premium, and education-oriented.
- Use French typographic apostrophes such as `d’apprentissage`, `l’élève`, and `qu’un`.
- Keep Italian CTA labels natural and button-friendly.
- Preserve the same product meaning across all four languages without forcing literal structure.
- Adapt locale layout hints for mobile CTA fit and German heading stability.

Phase 20 docs:

- `docs/language/main-website-german-style-study.md`
- `docs/language/main-website-german-copy-reference.md`
- `docs/language/english-copy-rules.md`
- `docs/language/german-copy-rules.md`
- `docs/language/french-copy-rules.md`
- `docs/language/italian-copy-rules.md`
- `docs/language/cross-locale-copy-review-matrix.md`
- `docs/language/cross-locale-visual-qa.md`

Verification:

```bash
npm install
npm run dev -- --host 127.0.0.1
npm run build
```

Source-safety check:

```bash
cd /Users/zhdeng/newweb
git status --short
```

Phase 20 does not add product features or new languages.

## Phase 18 Production-Facing Cleanup and Stability Hardening

Phase 18 removes development, demo, mock, test, and Codex-related artifacts from normal user-facing UI while preserving explicitly gated local/demo workflows for development and QA.

Main goals:

- Remove demo/test/mock wording from normal user-facing pages.
- Remove provider/model/Codex traces from UI.
- Hide local account shortcuts from normal login/register paths unless explicit non-production flags enable them.
- Replace internal status values with user-friendly labels.
- Add environment guards for demo-only UI.
- Improve loading, empty, error, and success states.
- Prevent duplicate submissions in core flows.
- Keep local demo backend mechanics internal and documented, not visible to normal users.

Environment guard flags:

```bash
VITE_SHOW_DEMO_ACCOUNTS=false
VITE_SHOW_DEMO_BADGES=false
VITE_SHOW_DEMO_SURFACES=false
VITE_SHOW_INTERNAL_DEBUG=false
```

Important rule:

Demo backend and fallback data may still exist internally, but normal users should never see development language.

Bad:

- Demo onboarding path
- Mock checkout
- Codex response
- Test account
- Admin accounts are not created publicly

Good:

- Account setup
- Choose a plan
- Preparing your explanation
- Sign in to continue
- This page is not available for your account

Phase 18 docs:

- `docs/qa/production-facing-copy-audit.md`
- `docs/qa/demo-artifact-removal-checklist.md`
- `docs/qa/stability-hardening-checklist.md`

Verification:

```bash
npm run build
npm run dev -- --host 127.0.0.1
rg -n "demo|Demo|mock|Mock|test account|Test account|sample|Sample|Codex|fake|Fake|placeholder|Placeholder|development|virtual checkout|Virtual checkout|not created publicly" src/i18n/locales src/pages src/components
rg -n "status\\.replace|ticket\\.status|request\\.status|record\\.status|item\\.status|node\\.status|attachment\\.status" src/components src/pages
```

## Phase 16 Multilingual Language Optimization

Phase 16 adds STOA's first multilingual language system for the Swiss market and replaces user-facing technology-heavy wording with calmer education language.

Supported UI languages:

- English
- Deutsch
- Français
- Italiano

Language behavior:

- translations live under `src/i18n/locales/{en,de,fr,it}`
- namespaces include `common`, `home`, `auth`, `chat`, `parent`, `tutor`, `pricing`, `billing`, `support`, `admin`, and `errors`
- `LanguageSwitcher` persists the selected language in `localStorage` as `stoa_language`
- the app updates the root `<html lang>` attribute when language changes
- demo registration can pass optional `preferredLanguage`

User-facing terminology now prefers:

- `Learning Assistant`
- `Professional teacher support`
- `Explanation`
- `Ask a teacher`
- `Choose a plan`

Avoid user-facing copy such as `AI tutor`, `AI answer`, `chatbot`, `human backup`, `teacher backup`, and developer-facing pricing language.

Phase 16 docs:

- `docs/language/glossary.md`
- `docs/language/copy-style-guide.md`
- `docs/language/terminology-replacement.md`
- `docs/language/translation-qa-checklist.md`

Verification:

```bash
npm run lint
npm run build
rg "\bAI\b|AI-|AI |Artificial Intelligence|Chatbot|Robot Tutor|Virtual Teacher|Automated Teacher|Human backup|Teacher Backup|teacher backup|human tutor|What STOA is selling|What we are selling|Buy now|Customers|frontend enforce" src/pages src/components src/i18n -n
```

## Phase 17 Locale-Specific Copy and UI Refinement

Phase 17 improves multilingual copy and layout quality without adding new product features. The goal is not literal translation. Each language should use natural, local, education-friendly wording while preserving the same product meaning, tone, and brand.

Main rules:

- English, German, French, and Italian can use different sentence structures.
- German hero titles should be shorter or split into multiple lines.
- Avoid long direct translations in large headings.
- Avoid user-facing terms such as `AI`, `human backup`, `teacher backup`, `what we are selling`, and `buy now`.
- Use `Learning Assistant` and `Professional teacher support` instead.
- Prefer education value language over sales language.
- Keep parent report copy calm and non-alarmist.
- Keep tutor copy professional and avoid implying teachers are replaced.

Hero copy examples:

```text
English:
Learn with clarity.

German:
Lernen. Fragen. Verstehen.

French:
Comprendre avec confiance.

Italian:
Studiare con più chiarezza.
```

Phase 17 docs:

- `docs/language/locale-copy-rules.md`
- `docs/language/german-copy-rules.md`
- `docs/language/french-copy-rules.md`
- `docs/language/italian-copy-rules.md`
- `docs/language/copy-review-matrix.md`
- `docs/language/visual-qa-by-locale.md`

Verification:

```bash
npx tsc -b --pretty false
npm run build
rg "\bAI\b|Artificial Intelligence|AI Support|AI answer|AI response|AI tutor|Chatbot|\bBot\b|Human backup|Teacher backup|What we are selling|What STOA is selling|Buy now|Customers|human tutor|teacher backup|human backup" src/i18n src/data src/components src/pages -n
```

Handoff gaps:

- German, French, and Italian still need native-speaker review before a broad market launch.
- Legal-sensitive copy still needs professional legal translation and legal review.
- Phase 18 should automate cross-locale screenshot or visual-regression checks.

## Phase 15 Homepage Onboarding and Learning-First Chat

Phase 15 refines STOA's first impression and core learning path. It does not add a production backend or new large product modules. It makes the product story clearer:

```text
Student starts learning
  -> Learning Assistant explains first
  -> teacher joins only when needed
  -> parent follows progress
```

Main Phase 15 updates:

- magazine-style homepage with one primary `Start Learning` CTA
- homepage learning flow replacing the old technology / teacher / parent parallel-card presentation
- premium UI direction using derived STOA burgundy, warm paper, charcoal, and restrained warm accents
- role-based registration for Student, Parent, and Tutor
- student onboarding with school, grade, subjects, and parent link fields
- parent onboarding with child profile fields
- tutor onboarding with teaching profile and mock credential upload
- chat empty state that sends students straight into asking homework questions
- inline `Ask a teacher` action below Learning Assistant explanations

Recommended Phase 15 demo path:

```text
/ -> Start Learning -> /login?next=/chat -> register or login -> /chat
```

Demo backend additions:

- `POST /auth/register` accepts role-specific `profile` payloads
- `POST /files/tutor-credentials` accepts mock PDF, PNG, and JPEG uploads up to 10 MB
- tutor onboarding returns `verificationStatus: pending_review`
- student onboarding can return `parentLinked: true`

See `docs/demo/phase15-demo-flow.md` and `docs/qa/demo-backend-qa.md`.

## Phase 14 Demo Backend Stabilization

Phase 14 does not build the production backend. It stabilizes a lightweight demo backend for frontend testing and product demos, while keeping the backend simple, replaceable, and decoupled from future real backend and AWS work.

The demo backend supports:

- demo login and register
- student chat demo
- teacher help request demo
- parent learning records and reports
- pricing and mock checkout flow
- referral link demo
- support ticket demo
- admin analytics mock data

Recommended local API mode:

```bash
VITE_API_MODE=demo
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_MSW=false
VITE_ENABLE_DEMO_API=true
```

Other supported API modes:

```bash
VITE_API_MODE=mock
VITE_API_MODE=staging
VITE_API_MODE=production
```

Demo accounts:

- `student@test.com / password123`
- `parent@test.com / password123`
- `tutor@test.com / password123`
- `admin@test.com / password123`

Run demo backend:

```bash
npm run demo:backend
```

Reset demo data:

```bash
npm run demo:reset
```

Phase 14 docs:

- `docs/demo/current-project-demo-guide.md`
- `docs/demo-backend/demo-backend-scope.md`
- `docs/demo-backend/demo-api-contract.md`
- `docs/demo-backend/demo-data.md`
- `docs/demo-backend/demo-reset-flow.md`
- `docs/backend-integration/real-backend-readiness.md`
- `docs/backend-integration/aws-readiness-notes.md`
- `docs/qa/demo-backend-qa.md`

The frontend should depend only on API contracts, not on demo backend internals.

## Phase 13 Information Architecture and UX Optimization

Phase 13 does not add new product modules. It organizes the existing STOA frontend pages, routes, navigation, page hierarchy, user journeys, demo paths, and UI structure so each role has a clearer product flow.

Main work:

- Page inventory and route map
- Role-based navigation architecture
- User journey map
- Page entry / exit audit
- Orphan page audit
- Duplicate page audit
- Route and navigation configuration
- Breadcrumbs, back buttons, and page action helpers
- CTA hierarchy and layout guidelines
- Mobile navigation rules
- Final demo flow cleanup

Key files:

- `docs/ia/page-inventory.md`
- `docs/ia/route-map.md`
- `docs/ia/navigation-architecture.md`
- `docs/ia/user-journeys.md`
- `docs/ia/page-entry-exit-audit.md`
- `docs/ia/orphan-page-audit.md`
- `docs/ia/duplicate-page-audit.md`
- `docs/ux/cta-guidelines.md`
- `docs/ux/layout-guidelines.md`
- `docs/ux/mobile-navigation.md`
- `docs/demo/final-demo-flow.md`
- `src/app/router/routeConfig.ts`
- `src/app/router/routeGroups.ts`
- `src/lib/navigation.ts`

Important principle: the goal is to make STOA easier to understand and navigate, not to add more features.

## Phase 12 Frontend Platform Scaling and Advanced Learning Intelligence Design

Phase 12 is frontend-only. It prepares STOA for platform-level demos across organizations, schools, tutoring centers, learning intelligence, tutor operations, parent monthly reporting, analytics, retention, and partnership onboarding.

This phase does not implement production backend, production database, real multi-tenant permissions, real AI diagnosis, curriculum graph computation, tutor matching, marketing automation, or CRM systems. Demo and test behavior uses typed API contracts plus mock fallback data.

Main additions:

- Organization selector and workspace dashboard
- Organization students, tutors, reports, and analytics pages
- Advanced student learning profile
- Weak-point diagnosis UI
- Curriculum graph UI
- Tutor assignment board and schedule overview
- Parent monthly report UI
- Advanced analytics and retention UI
- School and tutoring center partnership onboarding

Important mock API contracts:

- `GET /organizations`
- `GET /organizations/:organizationId/summary`
- `GET /organizations/:organizationId/students`
- `GET /organizations/:organizationId/tutors`
- `GET /organizations/:organizationId/reports`
- `GET /students/:studentId/learning-profile`
- `GET /students/:studentId/diagnosis`
- `GET /students/:studentId/curriculum-graph`
- `GET /parent/children/:childId/monthly-report`
- `GET /tutors/assignment-board`
- `GET /admin/advanced-analytics`
- `GET /admin/retention`
- `POST /partnership/interests`

Demo routes:

- `/organization`
- `/organization/students`
- `/organization/tutors`
- `/organization/reports`
- `/organization/analytics`
- `/organization/tutor-assignment`
- `/students/student-anna/learning-profile`
- `/students/student-anna/diagnosis`
- `/students/student-anna/curriculum-graph`
- `/parent/children/student-anna/monthly-report`
- `/admin/advanced-analytics`
- `/admin/retention`
- `/for-schools`
- `/for-tutoring-centers`
- `/partnership/onboarding`

## Local Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:5173/
```

Build production version:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Check code quality:

```bash
npm run lint
```

## Phase 2 Frontend Foundation

This project now includes:

- TailwindCSS
- shadcn-style local UI components
- React Router
- TanStack Query
- Zustand
- Axios
- lucide-react

## Phase 3 Core Product UI

This phase adds the first version of the STOA product interface.

Included pages:

- `/chat`
- `/dashboard`

Included UI modules:

- Conversation sidebar
- Chat message list
- Message bubbles
- Chat input
- Mock AI response state
- Teacher help placeholder
- Student dashboard cards
- Recent questions
- Weak topics
- Learning progress
- Teacher feedback

This phase uses mock data only. Backend integration is handled in Phase 4.

## Phase 4 Backend Integration

This phase connects the chat UI to the backend Chat API.

Required frontend environment variable:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Start frontend:

```bash
npm run dev
```

Expected backend endpoints:

- `GET /conversations`
- `GET /conversations/:conversationId`
- `POST /conversations`
- `POST /conversations/:conversationId/messages`
- `POST /teacher-help/request`

Local development URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- FastAPI Docs: http://localhost:8000/docs

FastAPI CORS must allow the frontend origin:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Testing-stage AI model strategy:

- The frontend calls only the unified backend Chat API.
- The frontend does not call OpenAI, Claude, Gemini, DeepSeek, Codex, or other model APIs directly.
- During the testing stage, the backend may use Codex as the temporary AI conversation provider.
- Later model provider changes should not require frontend API changes.

This phase does not implement streaming. AI responses are expected to be returned by the backend in the normal HTTP response.

## Phase 5 Streaming Chat and File Upload

This phase upgrades the chat experience from normal HTTP responses to streaming AI responses.

New capabilities:

- Streaming assistant responses
- Stop generation
- Retry failed user messages
- Create new conversation
- Upload homework images or PDFs
- Attach uploaded files to chat messages
- Teacher help request status

Frontend still calls only the unified STOA backend API. The testing-stage AI provider may continue to be Codex on the backend side. The frontend must not call model APIs directly.

Expected new endpoints:

- `POST /conversations/:conversationId/messages/stream`
- `POST /files`
- `GET /files/:fileId`
- `GET /teacher-help/request/:requestId`

Local frontend environment:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

File upload limits:

- Supported types: PNG, JPEG, PDF
- Maximum size: 10 MB per file
- Maximum pending attachments: 3

## Phase 6 Authentication and User Roles

This phase adds authentication, role-based routing, parent visibility, tutor help-request handling, and a local SQLite-backed test backend.

User roles:

- `student`
- `parent`
- `tutor`
- `admin`

Public routes:

- `/login`
- `/register`
- `/forgot-password`

Student routes:

- `/dashboard`
- `/chat`
- `/profile`
- `/learning-history`

Parent routes:

- `/parent`
- `/parent/children/:childId`
- `/parent/children/:childId/report`
- `/parent/children/:childId/history`

Tutor routes:

- `/tutor`
- `/tutor/requests/:requestId`

Admin route:

- `/admin`

Expected backend endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `GET /students/me/profile`
- `PATCH /students/me/profile`
- `GET /students/me/learning-history`
- `GET /conversations`
- `GET /conversations/:conversationId`
- `POST /conversations`
- `POST /conversations/:conversationId/messages`
- `POST /conversations/:conversationId/messages/stream`
- `GET /parents/me/children`
- `GET /parents/me/children/:childId/summary`
- `GET /parents/me/children/:childId/report`
- `GET /parents/me/children/:childId/history`
- `GET /tutors/me/help-requests`
- `GET /tutors/me/help-requests/:requestId`
- `PATCH /tutors/me/help-requests/:requestId`
- `POST /tutors/me/help-requests/:requestId/notes`

Frontend token storage in this phase:

- `localStorage` key: `stoa_access_token`

Production security may later move to httpOnly cookies or refresh-token based flows.

### Local SQLite Test Backend

SQLite is used only for local functional testing. The frontend does not connect to SQLite directly. The frontend calls the local backend API, and the local backend reads and writes SQLite.

Local backend structure:

```text
Frontend
  -> HTTP
Local FastAPI backend
  -> SQLite local.db
```

The local database supports users, roles, profiles, parent-child links, conversations, messages, uploaded file metadata, teacher help requests, and learning history.

Install local backend dependencies:

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
```

Seed local data:

```bash
cd backend
PYTHONPATH=. .venv/bin/python -m app.seed
```

Start local backend:

```bash
cd backend
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000
```

Suggested seed accounts:

- `student@test.com / password123`
- `parent@test.com / password123`
- `tutor@test.com / password123`
- `admin@test.com / password123`

## Phase 7 Product Polishing and MVP Readiness

This phase prepares the STOA frontend for MVP demos and early testing.

Main improvements:

- Unified UI polish through shared page containers, headers, section headers, and UI guidelines.
- Mobile responsive improvements for chat, dashboards, parent pages, tutor pages, and forms.
- Skeleton loading states for core pages.
- Toast notifications for auth, profile, upload, teacher help, and tutor actions.
- Form validation for login, register, student profile, chat input, and file upload.
- Application error boundary with recovery UI.
- Basic analytics tracking and a usage event API contract.
- Parent weekly report view.
- Tutor workflow filtering, status updates, and teacher notes.
- Demo seed data and development demo login shortcuts.
- Staging environment configuration preparation.

New Phase 7 routes and endpoints:

- `GET /parents/me/children/:childId/report`
- `POST /analytics/events`
- `POST /tutors/me/help-requests/:requestId/notes`

Usage tracking contract:

```http
POST /analytics/events
```

```json
{
  "name": "chat_message_sent",
  "payload": {
    "conversationId": "conv-1",
    "subject": "Mathematics",
    "hasAttachments": true
  },
  "createdAt": "2026-05-24T12:00:00Z"
}
```

The local SQLite backend can store analytics events when analytics is enabled.

Demo accounts in local development:

- `student@test.com / password123`
- `parent@test.com / password123`
- `tutor@test.com / password123`
- `admin@test.com / password123`

Recommended MVP demo flow:

1. Login as student.
2. Open dashboard.
3. Start chat.
4. Upload a homework image or PDF.
5. Receive a streaming AI response.
6. Request teacher help.
7. Login as tutor.
8. Filter and open the help request.
9. Add a teacher note and resolve the request.
10. Login as parent.
11. View child summary and weekly report.

Phase 7 environment variables:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_ENABLE_DEMO_SHORTCUTS=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_FEEDBACK=true
```

Staging example:

```bash
VITE_API_BASE_URL=https://api-staging.stoa.example
VITE_APP_ENV=staging
VITE_ENABLE_DEMO_SHORTCUTS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FEEDBACK=true
```

Production example:

```bash
VITE_API_BASE_URL=https://api.stoa.example
VITE_APP_ENV=production
VITE_ENABLE_DEMO_SHORTCUTS=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FEEDBACK=true
```

MVP readiness checklist:

- Core pages use shared layout primitives.
- Mobile chat, dashboard, parent, and tutor views avoid horizontal overflow.
- Loading states use skeletons instead of plain loading text.
- Key mutations show toast feedback.
- Login, register, profile, chat input, and upload inputs validate before submit.
- Parent can open the weekly report from child visibility flows.
- Tutor can filter requests, update status, and add notes.
- Analytics events are emitted without sensitive message content.
- Demo seed data supports student, tutor, and parent walkthroughs.
- `npm run build`, `npm run lint`, Python syntax check, and SQLite seed pass locally.

## Phase 8 Staging, QA, and Early User Testing

This phase prepares the STOA frontend for staging deployment and early user testing.

Main additions:

- Staging deployment configuration for Vite SPA hosting.
- SPA fallback config for Vercel and Netlify.
- GitHub Actions CI for install, lint, and build checks.
- Manual QA checklist.
- Playwright E2E smoke tests.
- Feedback collection UI and backend endpoint.
- Bug tracking workflow and issue template.
- Performance baseline documentation.
- Frontend security review checklist.
- Privacy and terms placeholders.

Staging environment variables:

```bash
VITE_API_BASE_URL=https://api-staging.stoa.example
VITE_APP_ENV=staging
VITE_ENABLE_DEMO_SHORTCUTS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FEEDBACK=true
```

Build and preview locally:

```bash
npm run build
npm run preview
```

Run E2E tests:

```bash
npm run test:e2e
```

The E2E suite expects the local backend to be seeded and running:

```bash
cd backend
.venv/bin/python -m app.reset_demo_data
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000
```

Recommended staging demo flow:

1. Login as student.
2. Create or open a chat conversation.
3. Upload a homework file.
4. Receive a streaming AI response.
5. Request teacher help.
6. Login as tutor.
7. Resolve the teacher request.
8. Login as parent.
9. View child summary and report.
10. Submit feedback.

Phase 8 documents:

- `docs/deployment/staging.md`
- `docs/qa/manual-qa-checklist.md`
- `docs/testing/e2e.md`
- `docs/demo/mvp-demo-flow.md`
- `docs/feedback/feedback-workflow.md`
- `docs/security/frontend-security-review.md`
- `docs/performance/performance-baseline.md`
- `docs/deployment/production-readiness-plan.md`

## Phase 9 Production Readiness and Pilot Launch

This phase prepares STOA for a small-scale real pilot launch.

Main additions:

- Production deployment plan
- Production environment variables
- SQLite-to-production database boundary
- Pilot API contract freeze
- Error monitoring
- Logging strategy
- Real analytics backend delivery
- Pilot onboarding flow
- Support workflow
- Basic admin operations
- Privacy review
- Backup and restore strategy
- Pricing placeholder
- Billing placeholder
- Pilot launch checklist

Production environment example:

```bash
VITE_API_BASE_URL=https://api.stoa.example
VITE_APP_ENV=production
VITE_ENABLE_DEMO_SHORTCUTS=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FEEDBACK=true
VITE_ENABLE_ERROR_MONITORING=true
```

Pilot launch goal:

- 5-10 students
- 3-5 parents
- 1-3 tutors
- 1-2 weeks of controlled testing

Before pilot launch:

- CI must pass
- E2E tests must pass or be scheduled as a launch gate
- Manual QA must be completed
- Error monitoring must be active
- Feedback or support collection must be active
- Privacy and terms pages must be accessible
- Backup and restore ownership must be confirmed with the backend team

Phase 9 documents:

- `docs/production/production-readiness.md`
- `docs/production/launch-checklist.md`
- `docs/operations/error-monitoring.md`
- `docs/operations/logging.md`
- `docs/operations/analytics.md`
- `docs/operations/support-workflow.md`
- `docs/operations/backup-restore.md`
- `docs/privacy/privacy-review.md`
- `docs/pilot/pilot-launch-plan.md`
- `docs/pilot/pilot-feedback-report-template.md`

## Phase 10 Pilot Iteration, Payment Preparation, and Production Launch

This phase prepares STOA for production launch and early commercial validation.

Main additions:

- Pilot feedback review
- Critical bug fix sprint
- Core Student, Parent, and Tutor UX iteration
- Pricing page upgrade
- Billing and subscription preparation
- Stripe Checkout direction with backend-owned session creation
- Virtual checkout flow for frontend demos and E2E before real backend payment integration
- Parent conversion funnel
- Tutor operations improvements
- Admin operations improvements
- Privacy and terms launch-ready drafts
- Production release process, rollback plan, and post-launch monitoring plan

Production feature flags:

```bash
VITE_ENABLE_PAYMENT=false
VITE_ENABLE_MOCK_CHECKOUT=false
VITE_ENABLE_PUBLIC_REGISTER=false
VITE_ENABLE_TEACHER_HELP=true
VITE_ENABLE_PARENT_REPORT=true
```

Local demo checkout flags:

```bash
VITE_ENABLE_PAYMENT=false
VITE_ENABLE_MOCK_CHECKOUT=true
```

Billing API contracts:

- `GET /billing/plans`
- `GET /billing/subscription`
- `GET /billing/usage`
- `GET /billing/feature-access`
- `POST /billing/checkout-session`

Recommended launch flow:

1. Review pilot feedback.
2. Fix P0 and P1 bugs or document workarounds.
3. Run CI, build, lint, and E2E tests.
4. Run manual QA including pricing, billing, and virtual checkout.
5. Confirm monitoring, analytics, support workflow, privacy, and terms.
6. Deploy production frontend.
7. Monitor the first 72 hours.

Phase 10 documents:

- `docs/pilot/pilot-review.md`
- `docs/pricing/pricing-validation.md`
- `docs/pricing/subscription-model.md`
- `docs/launch/launch-checklist.md`
- `docs/launch/release-process.md`
- `docs/launch/rollback-plan.md`
- `docs/launch/post-launch-monitoring.md`

## Environment Variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Default API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Available Routes

- `/` Home
- `/login` Login
- `/register` Register
- `/privacy` Privacy pilot draft
- `/terms` Terms launch draft
- `/pricing` Pricing validation
- `/for-parents` Parent acquisition landing
- `/how-it-works` Product flow landing
- `/ai-homework-help` AI homework help entry
- `/teacher-support` Teacher support landing
- `/for-schools` School partnership placeholder
- `/for-tutoring-centers` Tutoring center partnership placeholder
- `/onboarding` Pilot onboarding
- `/support` Pilot support
- `/dashboard` Student dashboard
- `/chat` Student chat product UI
- `/profile` Student profile
- `/learning-history` Student learning history
- `/billing` Billing and subscription
- `/billing/checkout/demo` Virtual checkout
- `/billing/checkout/success` Virtual checkout success
- `/billing/checkout/cancel` Virtual checkout cancel
- `/billing/success` Billing success alias
- `/billing/cancelled` Billing cancelled alias
- `/referrals` Referral invite page
- `/support/tickets` Support tickets
- `/support/tickets/:ticketId` Support ticket detail
- `/parent` Parent dashboard
- `/parent/children/:childId` Child learning summary
- `/parent/children/:childId/report` Child weekly report
- `/parent/children/:childId/history` Child learning history
- `/tutor` Tutor dashboard
- `/tutor/availability` Tutor availability editor
- `/tutor/requests/:requestId` Tutor help-request detail
- `/admin` Admin dashboard
- `/admin/analytics` Admin operational analytics
- `/admin/usage` Admin usage summary
- `/admin/feedback` Admin feedback list
- `/admin/help-requests` Admin help request list
- `/admin/users` Admin users contract shell
- `/admin/support` Admin support ticket triage
- `/admin/support/:ticketId` Admin support ticket detail
- `/admin/billing-interest` Admin billing interest shell
- `/admin/system` Admin system status shell

## Phase 11 Paid Launch Frontend and Operational UI Scaling

This phase prepares the STOA frontend for early paid validation and operational scaling.

Scope note: Phase 11 is frontend-only. It does not implement production backend services, payment webhooks, subscription enforcement backend, production analytics backend, formal support ticket backend, or complex database design. Existing local backend/database code is demo and test support only.

Main additions:

- Pricing plans from a frontend API contract with demo fallback data.
- Billing page with subscription status, usage quota, feature access, and mock checkout.
- Feature gating UI for quota and upgrade prompts.
- Parent acquisition pages: `/for-parents`, `/how-it-works`, `/ai-homework-help`, `/teacher-support`.
- Partner entry pages: `/for-schools`, `/for-tutoring-centers`.
- Referral page and referral-code capture through registration.
- Tutor availability editor.
- Support ticket UI for users and admins.
- Admin operational analytics dashboard.
- UTM campaign tracking.

Additional API contracts:

- `GET /referrals/me`
- `GET /tutors/me/availability`
- `PATCH /tutors/me/availability`
- `POST /support/tickets`
- `GET /support/tickets`
- `GET /support/tickets/:ticketId`
- `GET /admin/support/tickets`
- `GET /admin/analytics/overview`

Phase 11 documents:

- `docs/demo/frontend-only-boundary.md`
- `docs/billing/checkout-flow-contract.md`
- `docs/billing/subscription-access-ui.md`
- `docs/growth/parent-acquisition-funnel.md`
- `docs/growth/referral-program.md`
- `docs/growth/paid-launch-campaign.md`
- `docs/operations/tutor-availability-ui.md`
- `docs/operations/support-ticket-ui.md`
- `docs/analytics/paid-launch-events.md`
- `docs/analytics/operational-dashboard.md`
- `docs/qa/phase11-manual-qa-checklist.md`

## Phase 19 Brand-Aligned Visual Refinement

This phase aligns the STOA learning platform visually with the company homepage without copying it.

Source project:

```text
/Users/zhdeng/newweb
```

Important rule: do not modify anything inside `/Users/zhdeng/newweb`. The homepage project is read-only for this phase.

Main goals:

- Read and understand the company homepage design language.
- Extract colors, typography, spacing, component style, image style, and visual tone.
- Translate the design language into learning-platform design rules.
- Keep the learning platform visually aligned but independent.
- Adjust design tokens and component styles in the learning platform only.

Implemented Phase 19 artifacts:

- `docs/design/main-website-readonly-audit.md`
- `docs/design/main-website-design-translation.md`
- `docs/design/learning-platform-token-adjustment.md`
- `docs/design/visual-compatibility-qa.md`
- `src/styles/brand-tokens.css`
- `src/styles/platform-theme.css`

This phase does not add new product features, new routes, new languages, backend behavior, payment behavior, or copied homepage source.

## Project Status

Phase 19: brand-aligned learning-platform visual refinement based on read-only company homepage design translation, with derived tokens, refined shared primitives, public/auth/app visual alignment, and visual QA evidence.
