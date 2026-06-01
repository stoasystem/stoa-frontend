# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.34 Phase 36: Engineering Quality, CI Reliability, and Local Workflow Hardening** - Phases 191-194 (shipped 2026-05-27)
- ⏳ **v1.35 Phase 37: Student Language Preference and Learning Assistant Response Localization** - Phases 195-199 (planned)

## Phases

- [ ] **Phase 195: Student Profile Answer-Language UI and Contract Types** - Add supported answer-language preference to student profile/onboarding contracts and UI.
- [ ] **Phase 196: Demo Backend Profile Persistence and API Contract** - Persist, validate, and return student answer-language preference through registration and profile endpoints.
- [ ] **Phase 197: Learning Assistant Language Propagation and Fallback Behavior** - Pass saved student answer language into chat generation, prompt construction, and fallback responses.
- [ ] **Phase 198: Multilingual Regression, Smoke Checks, and Safety Verification** - Verify language behavior, profile flows, internal-term safety, lint, and build.
- [ ] **Phase 199: Documentation, Handoff, and Milestone Audit** - Document local verification, API contract, deferred scope, and milestone coverage.

## Phase Details

### Phase 195: Student Profile Answer-Language UI and Contract Types

**Goal**: Students can see, choose, and update the Learning Assistant answer language from the supported language set in frontend profile/onboarding surfaces.
**Depends on**: Phase 194
**Requirements**: PROF37-01, PROF37-02, PROF37-03, PROF37-04, API37-01
**Success Criteria** (what must be TRUE):
  1. `StudentProfile` and onboarding types expose a supported answer-language field.
  2. Student profile displays the saved Learning Assistant answer language.
  3. Student profile edit form lets students choose English, German, French, or Italian.
  4. Student onboarding can provide an initial answer-language preference.
  5. User-facing copy clearly distinguishes Learning Assistant answer language from the browser interface language.
**Plans**: 195-PLAN.md
**UI hint**: yes

### Phase 196: Demo Backend Profile Persistence and API Contract

**Goal**: The local/demo backend persists the answer-language preference and exposes it through stable student profile and registration contracts.
**Depends on**: Phase 195
**Requirements**: API37-02, API37-03, API37-04, API37-05, API37-06
**Success Criteria** (what must be TRUE):
  1. Demo backend student profile persistence includes a normalized supported answer-language value.
  2. Existing local demo profiles remain readable with a safe default when no value exists.
  3. Registration persists a student answer-language preference when provided.
  4. `GET /students/me/profile` returns the saved preference.
  5. `PATCH /students/me/profile` validates and persists supported language updates.
**Plans**: 196-PLAN.md
**UI hint**: no

### Phase 197: Learning Assistant Language Propagation and Fallback Behavior

**Goal**: New Learning Assistant responses use the saved student answer-language preference across the prompt, provider request, and template fallback paths.
**Depends on**: Phase 196
**Requirements**: CHAT37-01, CHAT37-02, CHAT37-03, CHAT37-04, CHAT37-05
**Success Criteria** (what must be TRUE):
  1. Chat generation reads the saved profile answer language instead of hard-coding English.
  2. `LearningAssistantRequest.language` receives a normalized supported language code.
  3. Prompt text continues to include the requested response language.
  4. Template fallback can respond naturally in English, German, French, and Italian for generic and safety-critical paths.
  5. Frontend chat UI remains provider-agnostic and avoids internal model/provider/debug terms.
**Plans**: 197-PLAN.md
**UI hint**: no

### Phase 198: Multilingual Regression, Smoke Checks, and Safety Verification

**Goal**: The profile-to-chat language flow is verified through targeted tests, browser checks, copy safety scans, and standard frontend quality gates.
**Depends on**: Phase 197
**Requirements**: QA37-01, QA37-02, QA37-03, QA37-04, QA37-05
**Success Criteria** (what must be TRUE):
  1. Python Learning Assistant tests cover English, German, French, and Italian requested answer languages.
  2. Backend/profile smoke checks cover registration, profile read, profile update, and chat response language propagation.
  3. Browser smoke checks cover the student profile answer-language control.
  4. User-facing profile/chat copy is checked for high-risk internal terms.
  5. `npm run lint` and `npm run build` pass.
**Plans**: 198-PLAN.md
**UI hint**: no

### Phase 199: Documentation, Handoff, and Milestone Audit

**Goal**: Developers understand how to verify the answer-language feature locally, what API contract changed, and what remains deferred.
**Depends on**: Phase 198
**Requirements**: DOC37-01, DOC37-02, DOC37-03
**Success Criteria** (what must be TRUE):
  1. README or developer docs explain local verification for student answer-language preference.
  2. API/demo backend contract docs record the field name, supported values, and behavior boundary.
  3. Handoff notes clarify production preference syncing, new languages, parent-managed preference, and historical-message translation are deferred.
  4. Requirements traceability maps every v1.35 requirement to exactly one phase.
  5. Milestone audit confirms planned coverage and next execution step.
**Plans**: 199-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 195. Student Profile Answer-Language UI and Contract Types | 0/1 | Not started | — |
| 196. Demo Backend Profile Persistence and API Contract | 0/1 | Not started | — |
| 197. Learning Assistant Language Propagation and Fallback Behavior | 0/1 | Not started | — |
| 198. Multilingual Regression, Smoke Checks, and Safety Verification | 0/1 | Not started | — |
| 199. Documentation, Handoff, and Milestone Audit | 0/1 | Not started | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 195 | 5 | PROF37-01, PROF37-02, PROF37-03, PROF37-04, API37-01 |
| 196 | 5 | API37-02, API37-03, API37-04, API37-05, API37-06 |
| 197 | 5 | CHAT37-01, CHAT37-02, CHAT37-03, CHAT37-04, CHAT37-05 |
| 198 | 5 | QA37-01, QA37-02, QA37-03, QA37-04, QA37-05 |
| 199 | 3 | DOC37-01, DOC37-02, DOC37-03 |

**Total requirements:** 23
**Mapped requirements:** 23
**Unmapped requirements:** 0

## Next Up

Phase 195 should add the student profile/onboarding answer-language UI and typed contract before backend persistence and Learning Assistant propagation work begins.
