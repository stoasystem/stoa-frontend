# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.28 Phase 30: Final Demo Curriculum Packaging, External Testing, and Product Story Refinement
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.

## v1 Requirements

### Final Demo Curriculum Package

- [ ] **CURR30-01**: Team can review a final demo curriculum package that explains the equation demo scope, grade level, learning flow, included units, and excluded topics.
- [ ] **CURR30-02**: Team can use an equation path summary that locks the demo to lower-secondary Mathematics equations: one-variable linear equations, simple quadratic equations, and two-variable linear systems.
- [ ] **CURR30-03**: Team can review concise demo lesson summaries for linear equations, quadratic equations, and linear systems that explain learning goals, representative challenges, hints, and feedback purpose.
- [ ] **CURR30-04**: Team can explain why equations are the final demo theme using parent-understandable and teacher-understandable rationale.
- [ ] **CURR30-05**: Team can point to a demo limitations document that clearly states what the curriculum package does not prove or include.

### Product Story and Demo Script

- [ ] **STORY30-01**: Team can use a single product story statement that connects step-by-step Practice, Learning Chat explanations, professional teacher support, and Parent Report visibility.
- [ ] **STORY30-02**: Team can present a 10-minute integrated demo narrative covering Homepage, Student Dashboard, Practice Path, mistake, hint, Explain this step, Learning Chat, teacher support, and Parent Report.
- [ ] **STORY30-03**: Team can present a shorter 3-minute demo narrative for quick external conversations.
- [ ] **STORY30-04**: Team can present a 15-minute investor/stakeholder narrative that frames product positioning, parent value, learning data, pricing/growth direction, and roadmap boundaries.
- [ ] **STORY30-05**: Team can use script language that avoids exposing mock, demo-backend, provider, internal AI, or implementation terminology to external audiences.

### External Testing Materials

- [ ] **TEST30-01**: Team can use an external testing plan that defines target testers, testing goals, setup expectations, session format, and success signals for the Practice + Chat demo.
- [ ] **TEST30-02**: Student testers can follow a task sheet that starts from login/Dashboard, enters Practice, intentionally makes a mistake, views a hint, opens Learning Chat, returns to lesson, and completes the demo flow.
- [ ] **TEST30-03**: Parent testers can follow a task sheet that opens the child report and explains whether Practice activity, questions asked, teacher support, and recommended next step are understandable.
- [ ] **TEST30-04**: Tutor testers can follow a task sheet that reviews a Practice-origin teacher request and judges whether the practice context is sufficient.
- [ ] **TEST30-05**: Internal reviewers can follow a compact checklist to confirm the external demo can run in 3, 10, and 15 minute formats.

### Feedback Collection

- [ ] **FEED30-01**: Team can collect structured feedback with categories for clarity, ease of use, learning value, trust, parent visibility, teacher support, visual design, language clarity, confusing moments, and suggestions.
- [ ] **FEED30-02**: Student feedback questions cover next-step clarity, hint usefulness, explanation usefulness, homework relevance, and when to ask a teacher.
- [ ] **FEED30-03**: Parent feedback questions cover report comprehension, perceived value, teacher-support trust, at-home learning visibility, and missing information.
- [ ] **FEED30-04**: Tutor feedback questions cover student context sufficiency, struggle visibility, request workflow clarity, and whether the flow supports efficient teaching.
- [ ] **FEED30-05**: Feedback documentation separates observations, severity, audience, suggested follow-up, and whether the issue belongs in the Phase 31 backlog.

### Parent Value and Learning Report Framing

- [ ] **PARENT30-01**: Parent-facing story frames Practice and Chat as one learning activity rather than disconnected tools.
- [ ] **PARENT30-02**: Parent value framing explains what the child practised, what is becoming confident, what still benefits from practice, when the Learning Assistant helped, and when teacher support may help.
- [ ] **PARENT30-03**: Parent-facing language avoids failure, weakness, ranking, or anxiety wording.
- [ ] **PARENT30-04**: Learning report guidance recommends summary paragraph, small metric cards, topic list, and recommendation card without overloading the page with charts.

### Future Requirements and Backlog

- [ ] **FUTURE30-01**: Team can review future real curriculum requirements for expanding beyond the equation demo without treating Phase 30 as a full curriculum build.
- [ ] **FUTURE30-02**: Team can review future backend integration requirements for persisted Practice progress, Practice-to-Chat context, teacher request context, feedback capture, and reporting data.
- [ ] **FUTURE30-03**: Team can review a next-iteration backlog that separates Phase 31-ready demo refinements from later real product/backend/curriculum work.
- [ ] **FUTURE30-04**: Team can identify which Phase 30 findings should inform external testing, curriculum expansion, and formal backend planning.

### Documentation, README, and Verification

- [ ] **DOC30-01**: Required curriculum, testing, feedback, demo, and handoff documents exist in the requested directories.
- [ ] **DOC30-02**: README includes a Phase 30 section explaining the demo curriculum package, external testing plan, product story refinement, exclusions, and next milestone entry.
- [ ] **QA30-01**: Verification confirms the existing Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report demo flow remains coherent after packaging changes.
- [ ] **QA30-02**: Verification confirms `npm run build` succeeds.
- [ ] **QA30-03**: Final Phase 30 handoff identifies remaining risks, external testing assumptions, and why no new feature scope was added.

## Future Requirements

### Real Curriculum

- **CURRIC-FUTURE-01**: Build a broader Mathematics curriculum beyond equations after external testing validates the demo story.
- **CURRIC-FUTURE-02**: Add non-math practice paths only after the curriculum model and backend handoff are defined.
- **CURRIC-FUTURE-03**: Create a formal curriculum authoring and review workflow.

### Production Backend

- **BACKEND-FUTURE-01**: Persist student practice progress, mistakes, attempts, hints, and result summaries in a formal backend.
- **BACKEND-FUTURE-02**: Persist Practice-to-Learning-Chat context in conversation records.
- **BACKEND-FUTURE-03**: Persist Practice-origin teacher support requests with auditable context.
- **BACKEND-FUTURE-04**: Add formal feedback collection storage, privacy review, and reporting workflow.

### Research and Launch

- **RESEARCH-FUTURE-01**: Run external testing sessions and convert findings into prioritized product changes.
- **RESEARCH-FUTURE-02**: Prepare formal demo presentation assets after feedback confirms the product story is clear.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New curriculum topics such as geometry, probability, physics, trigonometry, calculus, or advanced functions | Phase 30 locks the demo curriculum to equations so quality and story stay focused. |
| New Practice Path feature expansion | Phase 30 packages and tests the existing flow; it does not add new product mechanics. |
| Production backend, database, CMS, analytics pipeline, CRM, or feedback storage | Phase 30 creates handoff requirements and docs only. |
| Formal teacher scheduling or live tutoring operations | Teacher support remains a demo escalation path and future backend/operations requirement. |
| Large UI redesign | Existing Phase 29 UI is the baseline; Phase 30 focuses on narrative, docs, and validation materials. |
| Real adaptive learning or recommendation algorithms | These require backend intelligence and real learning data outside this milestone. |
| Public marketing rewrite or investor deck production | Phase 30 creates demo scripts and product story docs, not a full marketing campaign. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CURR30-01 | Phase 159 | Complete |
| CURR30-02 | Phase 159 | Complete |
| CURR30-03 | Phase 159 | Complete |
| CURR30-04 | Phase 159 | Complete |
| CURR30-05 | Phase 159 | Complete |
| STORY30-01 | Phase 160 | Complete |
| STORY30-02 | Phase 160 | Complete |
| STORY30-03 | Phase 160 | Complete |
| STORY30-04 | Phase 160 | Complete |
| STORY30-05 | Phase 160 | Complete |
| TEST30-01 | Phase 161 | Pending |
| TEST30-02 | Phase 161 | Pending |
| TEST30-03 | Phase 161 | Pending |
| TEST30-04 | Phase 161 | Pending |
| TEST30-05 | Phase 161 | Pending |
| FEED30-01 | Phase 162 | Pending |
| FEED30-02 | Phase 162 | Pending |
| FEED30-03 | Phase 162 | Pending |
| FEED30-04 | Phase 162 | Pending |
| FEED30-05 | Phase 162 | Pending |
| PARENT30-01 | Phase 163 | Pending |
| PARENT30-02 | Phase 163 | Pending |
| PARENT30-03 | Phase 163 | Pending |
| PARENT30-04 | Phase 163 | Pending |
| FUTURE30-01 | Phase 163 | Pending |
| FUTURE30-02 | Phase 163 | Pending |
| FUTURE30-03 | Phase 163 | Pending |
| FUTURE30-04 | Phase 163 | Pending |
| DOC30-01 | Phase 164 | Pending |
| DOC30-02 | Phase 164 | Pending |
| QA30-01 | Phase 164 | Pending |
| QA30-02 | Phase 164 | Pending |
| QA30-03 | Phase 164 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after v1.28 roadmap creation*
