# Demo Backend QA Checklist

## Startup

- [ ] `npm run demo:reset` completes.
- [ ] `npm run demo:backend` starts the backend on `http://localhost:8000`.
- [ ] `GET /health` returns `ok: true`, service `stoa-demo-backend`, and mode `demo`.
- [ ] Frontend can start with `npm run dev`.
- [ ] Frontend can reach the demo backend with `VITE_API_MODE=demo`.

## Auth

- [ ] `student@test.com / password123` can log in.
- [ ] `parent@test.com / password123` can log in.
- [ ] `tutor@test.com / password123` can log in.
- [ ] `admin@test.com / password123` can log in.
- [ ] Register returns a demo user and token.
- [ ] Student registration accepts age, school, grade, subjects, parent name, and parent email.
- [ ] Student registration can return `parentLinked: true`.
- [ ] Parent registration accepts child profile fields and creates a linked demo child.
- [ ] Tutor registration accepts teaching profile fields and returns `verificationStatus: pending_review`.
- [ ] `/auth/me` returns the current user.
- [ ] Invalid credentials return `{ message, code }`.

## Phase 15 Homepage and Onboarding

- [ ] Homepage has a magazine-style hero.
- [ ] Homepage primary CTA is `Start Learning`.
- [ ] Homepage no longer shows AI Support / Teacher Backup / Parent Visibility as three equal entry cards.
- [ ] Homepage explains ask -> AI explanation -> teacher if needed -> parent progress.
- [ ] `Start Learning` routes unauthenticated users to `/login?next=/chat`.
- [ ] Login page links to register.
- [ ] Register first step offers Student, Parent, and Tutor only.
- [ ] Admin is not offered in public registration.
- [ ] Tutor credential upload accepts PDF, PNG, and JPEG.
- [ ] Tutor credential upload rejects unsupported file types and files larger than 10 MB.

## Student Chat

- [ ] Student can list conversations.
- [ ] Student can open a conversation.
- [ ] Student can create a conversation.
- [ ] Student can send a message.
- [ ] Assistant returns deterministic demo answer.
- [ ] Streaming endpoint returns mock SSE events.
- [ ] Seeded attachment metadata is visible on at least one conversation message.

## Teacher Help and Tutor

- [ ] Student can request teacher help.
- [ ] Teacher help request appears inline below an AI response.
- [ ] Tutor can list help requests.
- [ ] Tutor can open request detail.
- [ ] Tutor can update request status.
- [ ] Parent summary can show teacher-help records.

## Parent

- [ ] Parent can list linked child.
- [ ] Parent can view child summary.
- [ ] Parent can view learning history.
- [ ] Parent can view weekly report.
- [ ] Parent can view monthly report placeholder.

## Billing, Referral, Support, Admin

- [ ] Billing plans load.
- [ ] Subscription loads.
- [ ] Usage loads.
- [ ] Feature access loads.
- [ ] Mock checkout returns `/billing/success?plan=<plan>`.
- [ ] Referral summary returns `KELLER2026`.
- [ ] Support ticket can be created.
- [ ] Support ticket can be viewed.
- [ ] Admin analytics overview loads.
- [ ] Admin support tickets load.
- [ ] Admin help requests load.
- [ ] Admin feedback loads.

## Integration Readiness

- [ ] All Phase 14 endpoints are documented.
- [ ] Phase 15 onboarding and tutor credential upload demo contracts are documented.
- [ ] API mode is documented for `mock`, `demo`, `staging`, and `production`.
- [ ] Frontend API base URL is configurable.
- [ ] Demo fallback is disabled for staging/production examples.
- [ ] Real backend readiness document is complete.
- [ ] AWS readiness notes are complete.
- [ ] `npm run build` passes.
