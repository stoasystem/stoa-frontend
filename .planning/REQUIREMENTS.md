# Requirements: STOA Frontend v1.27

**Defined:** 2026-05-26
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with guided Learning Assistant behavior, active Practice Path learning, premium visual design, four-language copy, and demo-ready frontend flows.

## v1 Requirements

### Scope and Research

- [ ] **SCOPE29-01**: Developer can see that Phase 29 keeps Practice content fixed to the existing equation demo and does not expand courses, subjects, backend, database, or adaptive learning scope.
- [ ] **SCOPE29-02**: Developer can read research-backed interaction guidance that adapts Duolingo-style smooth lesson mechanics without copying its code, backend, visual style, punitive hearts, shop, gems, or leaderboard mechanics.
- [ ] **SCOPE29-03**: User-facing Practice UI remains premium, restrained, and education-oriented rather than cartoon-like or game-first.

### Practice Interaction

- [ ] **PRACTICE29-01**: Student can start a lesson from an intro state that explains the lesson title, what will be practiced, estimated time, challenge count, and start action.
- [ ] **PRACTICE29-02**: Student can answer a challenge on a stable screen with visible progress, prompt, answer control, check action, attempts indicator, and consistent layout.
- [ ] **PRACTICE29-03**: Student who answers correctly sees specific, calm feedback and a clear continue action.
- [ ] **PRACTICE29-04**: Student who answers incorrectly sees supportive feedback, a stable hint/retry area, and no direct first-step answer reveal.
- [ ] **PRACTICE29-05**: Student can retry after a wrong answer without losing lesson context or seeing layout jumps.
- [ ] **PRACTICE29-06**: Student can complete a lesson and see a result summary with correct count, topics practiced, mistakes to review, continue practice, review mistakes, and back-to-dashboard actions.
- [ ] **PRACTICE29-07**: Student can open mistakes review and use contextual next actions without failure-oriented language.

### Practice to Learning Chat

- [ ] **CHAT29-01**: Frontend defines a `PracticeChatContext` contract containing source, subject, lesson, challenge, prompt, student answer, topic, grade level, and return path fields.
- [ ] **CHAT29-02**: Student can click `Explain this step` from Practice after getting stuck and open Learning Chat with the current challenge context.
- [ ] **CHAT29-03**: Student can use `Ask in Learning Chat` from a result or mistake review state with the relevant practice context.
- [ ] **CHAT29-04**: Chat page displays a compact practice context card when opened from Practice.
- [ ] **CHAT29-05**: Chat page provides a clear `Back to lesson` action when practice context includes a return path.
- [ ] **CHAT29-06**: Learning Chat copy avoids `AI help` wording and frames the handoff as reviewing a practice step.

### Teacher Support Escalation

- [ ] **TEACH29-01**: Practice does not show teacher support as the first response to a wrong answer.
- [ ] **TEACH29-02**: Practice can show teacher support only after repeated incorrect attempts, hint use, Learning Assistant explanation, or explicit stuck intent.
- [ ] **TEACH29-03**: Frontend defines a `PracticeTeacherRequestContext` contract with source, subject, lesson, challenge, topic, student answer, and attempts.
- [ ] **TEACH29-04**: Student-facing teacher support copy asks whether a teacher should explain the step, without implying failure.
- [ ] **TEACH29-05**: Tutor/request-facing demo UI can show practice context when a teacher request originated from Practice.

### Site Layout and Student Entry Flow

- [ ] **IA29-01**: Public homepage learning entry copy does not make Practice and Chat compete; it uses a broad learning entry and explains that students can practice or ask a question when stuck.
- [ ] **IA29-02**: Student navigation clearly labels Dashboard, Practice, Learning Chat, History, and Profile.
- [ ] **IA29-03**: Student Dashboard presents Practice as the next recommended action and Chat as the specific-question action.
- [ ] **IA29-04**: Student Dashboard includes clear cards for Continue Practice, Ask a question, Recent learning activity, Recent mistakes, and Teacher support status.
- [ ] **IA29-05**: Practice breadcrumbs and Chat context breadcrumb/return behavior help students understand where they are.

### Parent Learning Activity

- [ ] **PARENT29-01**: Parent Report combines Practice and Chat into a unified learning activity summary rather than presenting disconnected tools.
- [ ] **PARENT29-02**: Parent Report can show questions asked, practice lessons completed, mistakes reviewed, teacher support requested, current practice path, and recommended next topic.
- [ ] **PARENT29-03**: Parent-facing copy stays supportive and avoids failure, weakness, ranking, or anxiety language.

### Localization, Documentation, and QA

- [ ] **LANG29-01**: English, German, French, and Italian copy exists for `Explain this step`, `Ask in Learning Chat`, `Back to lesson`, `Ask a question`, and teacher-support escalation wording.
- [ ] **LANG29-02**: German, French, and Italian labels fit existing mobile and desktop controls without button overflow.
- [ ] **DOC29-01**: Documentation exists for practice interaction refinement, Practice-to-Chat flow, Practice-to-teacher support flow, dashboard integration, parent report integration, site layout, student entry map, and integrated demo flow.
- [ ] **QA29-01**: QA checklist covers lesson start, challenge submit, correct feedback, incorrect feedback, hint, retry, result, mistakes review, Practice-to-Chat, Back to lesson, teacher escalation, dashboard, homepage, parent report, and demo flow.
- [ ] **QA29-02**: Final verification includes `npm run build` and a browser demo smoke that exercises Homepage -> Dashboard -> Practice -> wrong answer -> hint -> Explain this step -> Chat context -> Back to lesson -> completion -> Parent Report.
- [ ] **README29-01**: README documents Phase 29 scope, interaction goals, site layout goals, exclusions, and verification expectations.

## Future Requirements

### Practice Curriculum

- **CURRIC-FUTURE-01**: Add geometry, functions, physics, and broader math content after the equation demo is stable.
- **CURRIC-FUTURE-02**: Add real curriculum authoring, versioning, and content management.

### Backend and Intelligence

- **BACKEND-FUTURE-01**: Persist Practice-to-Chat context in a real backend conversation model.
- **BACKEND-FUTURE-02**: Add real adaptive learning and recommendation logic.
- **BACKEND-FUTURE-03**: Add production teacher request workflow and auditability.

### Analytics and Experimentation

- **ANALYTICS-FUTURE-01**: Track real conversion from Practice to Chat and teacher support after privacy review.
- **ANALYTICS-FUTURE-02**: Run usability tests and A/B experiments on entry flow and feedback timing.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New course subjects or large curriculum content | Phase 29 refines interaction and IA around the existing equation demo. |
| Production backend/database work | Phase 29 is frontend design, route state, mock contracts, docs, and demo QA only. |
| Real adaptive learning | Requires backend intelligence and curriculum data outside this milestone. |
| Punitive hearts, shop, gems, leaderboards, mascot rewards | These conflict with STOA's premium education positioning and research cautions about gamification misuse. |
| Direct frontend model/provider calls | Frontend remains provider-agnostic and talks only through STOA app/service boundaries. |
| Full LMS redesign | Phase 29 reorganizes entry flows, not a full learning management system. |
| Broad homepage redesign | Homepage work is limited to entry-copy and layout clarity needed for Practice/Chat positioning. |
| Production teacher support operations | Only demo UI/context handoff is in scope. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCOPE29-01 | Phase 153 | Pending |
| SCOPE29-02 | Phase 153 | Pending |
| SCOPE29-03 | Phase 153 | Pending |
| PRACTICE29-01 | Phase 154 | Pending |
| PRACTICE29-02 | Phase 154 | Pending |
| PRACTICE29-03 | Phase 154 | Pending |
| PRACTICE29-04 | Phase 154 | Pending |
| PRACTICE29-05 | Phase 154 | Pending |
| PRACTICE29-06 | Phase 154 | Pending |
| PRACTICE29-07 | Phase 154 | Pending |
| CHAT29-01 | Phase 155 | Pending |
| CHAT29-02 | Phase 155 | Pending |
| CHAT29-03 | Phase 155 | Pending |
| CHAT29-04 | Phase 155 | Pending |
| CHAT29-05 | Phase 155 | Pending |
| CHAT29-06 | Phase 155 | Pending |
| TEACH29-01 | Phase 156 | Pending |
| TEACH29-02 | Phase 156 | Pending |
| TEACH29-03 | Phase 156 | Pending |
| TEACH29-04 | Phase 156 | Pending |
| TEACH29-05 | Phase 156 | Pending |
| IA29-01 | Phase 157 | Pending |
| IA29-02 | Phase 157 | Pending |
| IA29-03 | Phase 157 | Pending |
| IA29-04 | Phase 157 | Pending |
| IA29-05 | Phase 157 | Pending |
| PARENT29-01 | Phase 157 | Pending |
| PARENT29-02 | Phase 157 | Pending |
| PARENT29-03 | Phase 157 | Pending |
| LANG29-01 | Phase 158 | Pending |
| LANG29-02 | Phase 158 | Pending |
| DOC29-01 | Phase 158 | Pending |
| QA29-01 | Phase 158 | Pending |
| QA29-02 | Phase 158 | Pending |
| README29-01 | Phase 158 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after v1.27 requirements definition*

