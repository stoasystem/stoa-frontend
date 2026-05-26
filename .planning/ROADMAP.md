# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- ✅ **v1.2 Core Product UI** - Phases 8-10 (shipped 2026-05-24)
- ✅ **v1.3 Phase 4 Backend Integration and Real Chat API** - Phases 11-14 (shipped 2026-05-24)
- ✅ **v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow** - Phases 15-20 (implemented 2026-05-24)
- ✅ **v1.5 Phase 6 Authentication, User Roles, and Parent Visibility** - Phases 21-27 (implemented 2026-05-24)
- ✅ **v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness** - Phases 28-34 (implemented 2026-05-25)
- ✅ **v1.7 Phase 8 Staging Deployment, QA, and Early User Testing** - Phases 35-40 (implemented 2026-05-25)
- ✅ **v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch** - Phases 41-47 (implemented 2026-05-25)
- ✅ **v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch** - Phases 48-55 (implemented 2026-05-25)
- ✅ **v1.10 Phase 11: Paid Launch Frontend, Growth Funnel, and Operational UI Scaling** - Phases 56-63 (implemented 2026-05-25)
- ✅ **v1.11 Phase 12: Frontend Platform Scaling, School Partnership UI, and Advanced Learning Intelligence Design** - Phases 64-72 (implemented 2026-05-25)
- ✅ **v1.12 Phase 13: Information Architecture, Page Flow, and UX Optimization** - Phases 73-79 (implemented 2026-05-25)
- ✅ **v1.13 Phase 14: Demo Backend Stabilization, Test Flow Completion, and Backend Integration Readiness** - Phases 80-86 (implemented 2026-05-25)
- ✅ **v1.14 Phase 15: Homepage Redesign, Onboarding Flow, and Premium UI Refinement** - Phases 87-91 (implemented 2026-05-25)
- ✅ **v1.15 Phase 16: Multilingual Language Optimization and AI Terminology Replacement** - Phases 92-97 (implemented 2026-05-25)
- ✅ **v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement** - Phases 98-102 (implemented 2026-05-25)
- ✅ **v1.17 Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal** - Phases 103-107 (implemented 2026-05-26)
- ✅ **v1.18 Phase 19: Brand-Aligned Visual Refinement with Main Website Design Translation** - Phases 108-112 (implemented 2026-05-26)
- ✅ **v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation** - Phases 113-117 (implemented 2026-05-26)
- ✅ **v1.20 Phase 21: Accessibility, Cross-Browser QA, Brand Detail Integration, and Release Quality Gate** - Phases 118-122 (implemented 2026-05-26)
- ✅ **v1.21 Phase 22: Final Demo Packaging, Stakeholder Review, and Launch Candidate Preparation** - Phases 123-127 (implemented 2026-05-26)
- ✅ **v1.22 Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release** - Phases 128-132 (shipped 2026-05-26)
- ✅ **v1.23 Phase 25: Local Codex Provider Integration for Complete Demo Flow** - Phases 133-136 (shipped 2026-05-26)
- ✅ **v1.24 Phase 26: Learning Assistant Functional QA, Multi-Turn Behavior Testing, and Bug Fixing** - Phases 137-140 (shipped 2026-05-26)
- ✅ **v1.25 Phase 27: Duolingo-Style Learning Quest Integration and Practice Flow Design** - Phases 141-146 (implemented 2026-05-26)
- ✅ **v1.26 Phase 28: Practice Path QA, Equation Lesson Design, and Demo Scenario Polishing** - Phases 147-152 (implemented 2026-05-26)
- ✅ **v1.27 Phase 29: Practice Path Interaction Refinement, Learning Platform Entry Flow, and Site Layout Reorganization** - Phases 153-158 (implemented 2026-05-26)
- ✅ **v1.28 Phase 30: Final Demo Curriculum Packaging, External Testing, and Product Story Refinement** - Phases 159-164 (shipped 2026-05-26)
- 🚧 **v1.29 Phase 31: Practice Game Entry Integration, Homepage Positioning, and Learning Platform Funnel Alignment** - Phases 165-170 (planned 2026-05-26)

## Phases

- [ ] **Phase 165: Practice Positioning, Research, and Site IA** - Lock Practice as a student learning entry and document public/app information architecture.
- [ ] **Phase 166: Homepage Practice Entry and Learning Funnel Presentation** - Add homepage Practice introduction and restrained Practice -> Chat -> Teacher -> Parent flow.
- [ ] **Phase 167: Student Dashboard and Practice-to-Chat Flow** - Reorganize student entry points and improve Practice wrong-answer, explanation, and return flows.
- [ ] **Phase 168: Parent Learning Activity and Report Integration** - Present Practice and Chat as one parent-visible learning activity.
- [ ] **Phase 169: Tutor Practice Context and Role Navigation Alignment** - Expose Practice-origin request context and align student/parent/tutor navigation.
- [ ] **Phase 170: Four-Language Copy, Demo Script, QA, README, and Build Closure** - Complete i18n, docs, demo script, QA checklist, README, and build verification.

## Phase Details

### Phase 165: Practice Positioning, Research, and Site IA

**Goal**: Practice Path has a research-backed place in STOA's product hierarchy and information architecture.
**Depends on**: Phase 164
**Requirements**: POS31-01, POS31-02, POS31-03, POS31-04, POS31-05, NAV31-01, NAV31-02, DOC31-01, DOC31-02
**Success Criteria** (what must be TRUE):
  1. Research notes summarize how homepage hierarchy, navigation, role dashboards, wayfinding, and Q&A organization should guide Phase 31.
  2. `docs/ia/site-layout-with-practice-entry.md` documents public, student, parent, and tutor structures.
  3. `docs/ia/student-learning-entry-map.md` documents Practice as an entry into Learning Chat, teacher support, and Parent Report visibility.
  4. Practice positioning explicitly says Practice is an entry path, Learning Chat is the explanation center, teacher support is escalation, and Parent Report is visibility.
  5. Public navigation remains uncluttered and Q&A remains separate from Pricing.
**Plans**: 165-PLAN.md
**UI hint**: no

### Phase 166: Homepage Practice Entry and Learning Funnel Presentation

**Goal**: Homepage introduces Practice without making STOA look like a game-first product.
**Depends on**: Phase 165
**Requirements**: HOME31-01, HOME31-02, HOME31-03, HOME31-04, HOME31-05
**Success Criteria** (what must be TRUE):
  1. Homepage includes a section such as `Start with practice. Continue with clear explanations.`
  2. The section explains Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report in calm, premium education language.
  3. `Start learning` remains the primary CTA and Practice uses a secondary CTA.
  4. Visual treatment stays aligned with STOA's burgundy, charcoal, warm neutral, restrained editorial theme.
  5. The homepage still centers Learning Assistant, teacher support, and parent visibility as the main STOA value.
**Plans**: 166-PLAN.md
**UI hint**: yes

### Phase 167: Student Dashboard and Practice-to-Chat Flow

**Goal**: Students can naturally start in Practice, ask Learning Chat for explanation, and return to the lesson.
**Depends on**: Phase 166
**Requirements**: DASH31-01, DASH31-02, DASH31-03, DASH31-04, DASH31-05, FLOW31-01, FLOW31-02, FLOW31-03, FLOW31-04, FLOW31-05, CHAT31-01, CHAT31-02, CHAT31-03, CHAT31-04, NAV31-04
**Success Criteria** (what must be TRUE):
  1. Student Dashboard prioritizes Continue Practice and Ask a Question with clear relationship copy.
  2. Student navigation includes Practice and Learning Chat as clear sibling destinations.
  3. Wrong-answer feedback offers hint and explanation actions.
  4. Repeated-error states may offer teacher support after appropriate friction.
  5. Learning Chat shows Practice context and can return to the lesson.
  6. Lesson result and mistake-review surfaces support review with Chat, review mistakes, and continue Practice.
**Plans**: 167-PLAN.md
**UI hint**: yes

### Phase 168: Parent Learning Activity and Report Integration

**Goal**: Parents see Practice and Chat as one coherent learning activity.
**Depends on**: Phase 167
**Requirements**: PARENT31-01, PARENT31-02, PARENT31-03, PARENT31-04, PARENT31-05
**Success Criteria** (what must be TRUE):
  1. Parent Dashboard uses a unified Learning Activity summary.
  2. Parent Report explains Practice lessons, questions, explained steps, teacher support, and next focus together.
  3. Parent page includes copy explaining why Practice activity matters.
  4. Parent-facing language avoids failure, ranking, surveillance, or anxiety language.
  5. Parent activity UI works across English, German, French, and Italian.
**Plans**: 168-PLAN.md
**UI hint**: yes

### Phase 169: Tutor Practice Context and Role Navigation Alignment

**Goal**: Tutors can understand where a student got stuck before joining the support request.
**Depends on**: Phase 168
**Requirements**: TUTOR31-01, TUTOR31-02, TUTOR31-03, TUTOR31-04, NAV31-03
**Success Criteria** (what must be TRUE):
  1. Tutor Request Detail shows Source: Practice lesson when relevant.
  2. Tutor context includes topic, question, student answer, attempts, hint state, and Chat explanation state where available.
  3. Tutor wording says the student requested support after practising this step.
  4. Tutor page explains that Practice context helps teachers understand the stuck point.
  5. Student, parent, and tutor role navigation labels and active states align with the Phase 31 IA.
**Plans**: 169-PLAN.md
**UI hint**: yes

### Phase 170: Four-Language Copy, Demo Script, QA, README, and Build Closure

**Goal**: Phase 31 is localized, documented, verified, and ready for external integrated-flow testing.
**Depends on**: Phase 169
**Requirements**: I18N31-01, I18N31-02, I18N31-03, I18N31-04, I18N31-05, DOC31-03, DOC31-04, DOC31-05, DOC31-06, QA31-01, QA31-02
**Success Criteria** (what must be TRUE):
  1. Four-language core Practice-as-entry, Continue Practice, and Open Learning Chat copy is implemented.
  2. Practice CTA rules, teacher support rules, and demo script docs exist.
  3. QA checklist covers Practice-as-entry, site layout, product hierarchy, full demo flow, Practice-to-Chat, Parent Report, and build.
  4. README includes Phase 31 Practice Entry and Site Layout Integration guidance.
  5. `npm run build` succeeds.
  6. Browser/manual verification confirms the integrated homepage, student, Practice, Chat, parent, and tutor flow remains coherent.
**Plans**: 170-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 165. Practice Positioning, Research, and Site IA | 0/1 | Planned | — |
| 166. Homepage Practice Entry and Learning Funnel Presentation | 0/1 | Planned | — |
| 167. Student Dashboard and Practice-to-Chat Flow | 0/1 | Planned | — |
| 168. Parent Learning Activity and Report Integration | 0/1 | Planned | — |
| 169. Tutor Practice Context and Role Navigation Alignment | 0/1 | Planned | — |
| 170. Four-Language Copy, Demo Script, QA, README, and Build Closure | 0/1 | Planned | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 165 | 9 | POS31-01, POS31-02, POS31-03, POS31-04, POS31-05, NAV31-01, NAV31-02, DOC31-01, DOC31-02 |
| 166 | 5 | HOME31-01, HOME31-02, HOME31-03, HOME31-04, HOME31-05 |
| 167 | 15 | DASH31-01, DASH31-02, DASH31-03, DASH31-04, DASH31-05, FLOW31-01, FLOW31-02, FLOW31-03, FLOW31-04, FLOW31-05, CHAT31-01, CHAT31-02, CHAT31-03, CHAT31-04, NAV31-04 |
| 168 | 5 | PARENT31-01, PARENT31-02, PARENT31-03, PARENT31-04, PARENT31-05 |
| 169 | 5 | TUTOR31-01, TUTOR31-02, TUTOR31-03, TUTOR31-04, NAV31-03 |
| 170 | 11 | I18N31-01, I18N31-02, I18N31-03, I18N31-04, I18N31-05, DOC31-03, DOC31-04, DOC31-05, DOC31-06, QA31-01, QA31-02 |

**Total requirements:** 50
**Mapped requirements:** 50
**Unmapped requirements:** 0

## Next Up

**Phase 165: Practice Positioning, Research, and Site IA** — Lock Practice as a student learning entry and document public/app information architecture.

`$gsd-plan-phase 165`
