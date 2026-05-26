# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.29 Phase 31: Practice Game Entry Integration, Homepage Positioning, and Learning Platform Funnel Alignment
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA learning platform where Practice Path starts learning, Learning Chat explains unclear steps, professional teacher support helps when explanation is not enough, and Parent Report makes the learning process visible.

## v1 Requirements

### Product Positioning and Information Architecture

- [ ] **POS31-01**: Team can review a product-positioning document that states Practice Path is a learning entry path, not a replacement for Learning Chat or teacher support.
- [ ] **POS31-02**: Team can review a site-layout document that separates public site structure, student app structure, parent app structure, and tutor app structure.
- [ ] **POS31-03**: Team can review a student learning-entry map that explains Practice -> Learning Chat -> teacher support -> Parent Report.
- [ ] **POS31-04**: Team can use explicit copy rules that reject game-platform, Duolingo-clone, teacher-replacement, and Practice-replaces-Chat language.
- [ ] **POS31-05**: Team can review research-backed presentation guidance for homepage hierarchy, role navigation, dashboard hierarchy, wayfinding, and Q&A organization.

### Homepage Practice Entry

- [ ] **HOME31-01**: Homepage includes a Practice Path section that presents Practice as one entry into STOA learning, not as the whole product.
- [ ] **HOME31-02**: Homepage explains the restrained flow `Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report`.
- [ ] **HOME31-03**: Homepage preserves `Start learning` as the primary CTA and uses a secondary Practice CTA such as `See how practice works`.
- [ ] **HOME31-04**: Homepage Practice presentation uses the existing premium STOA visual language and avoids cartoon, shop, gems, or game-first styling.
- [ ] **HOME31-05**: Homepage copy keeps Learning Chat and professional teacher support more central than Practice mechanics.

### Student Dashboard and Navigation

- [ ] **DASH31-01**: Student Dashboard prioritizes `Continue Practice` as a primary learning entry with copy that explains students can ask for an explanation when a step is unclear.
- [ ] **DASH31-02**: Student Dashboard includes an `Ask a Question` or `Open Learning Chat` entry for specific homework questions.
- [ ] **DASH31-03**: Student Dashboard groups recent activity, teacher support status, and learning history below the primary Practice and Chat actions.
- [ ] **DASH31-04**: Student navigation includes Dashboard, Practice, Learning Chat, History, and Profile.
- [ ] **DASH31-05**: Student dashboard cards use consistent structure, CTA hierarchy, and responsive layout across desktop and mobile.

### Practice-to-Chat and Practice-to-Teacher Flow

- [ ] **FLOW31-01**: Practice wrong-answer feedback offers `Show hint` and `Explain this step` with clear education-centered wording.
- [ ] **FLOW31-02**: Repeated Practice errors show a stronger explanation prompt before offering teacher support.
- [ ] **FLOW31-03**: Teacher support appears only after appropriate friction such as repeated confusion, not immediately after every mistake.
- [ ] **FLOW31-04**: Lesson result or mistake-review surfaces include `Review with Learning Chat`, `Review mistakes`, and `Continue Practice`.
- [ ] **FLOW31-05**: Practice-to-Chat handoff carries topic, lesson, prompt, student answer, attempts, hint state, and return route through route state or mock/API contract.

### Learning Chat Practice Context

- [ ] **CHAT31-01**: Learning Chat displays a Practice context card when opened from Practice.
- [ ] **CHAT31-02**: Learning Chat includes a `Back to lesson` action when lesson return context exists.
- [ ] **CHAT31-03**: Practice-origin Chat copy explains the current step without exposing provider, prompt, debug, or mock terminology.
- [ ] **CHAT31-04**: Chat context presentation remains concise enough not to overwhelm normal homework chat.

### Parent Learning Activity and Reports

- [ ] **PARENT31-01**: Parent Dashboard uses a unified `Learning activity` summary rather than separate disconnected Practice and Chat modules.
- [ ] **PARENT31-02**: Parent Report explains Practice lessons completed, questions asked, steps explained, teacher support requested, and recommended next focus as one learning story.
- [ ] **PARENT31-03**: Parent-facing copy explains why Practice activity matters: independent attempts show where the student starts, and Chat shows where explanation is needed.
- [ ] **PARENT31-04**: Parent copy avoids failure, ranking, surveillance, or anxiety wording.
- [ ] **PARENT31-05**: Parent learning activity components are localized and responsive in English, German, French, and Italian.

### Tutor Practice Context

- [ ] **TUTOR31-01**: Tutor Request Detail shows Practice-origin source context when a request comes from a Practice lesson.
- [ ] **TUTOR31-02**: Tutor context includes source, topic, lesson prompt, student answer, attempts, hint viewed state, and Learning Chat explanation requested state where available.
- [ ] **TUTOR31-03**: Tutor-facing wording says the student requested support after practising this step, not that the game failed.
- [ ] **TUTOR31-04**: Tutor page explains that Practice context helps teachers understand where the student got stuck before joining the request.

### Public Navigation and Q&A Organization

- [ ] **NAV31-01**: Public navigation remains uncluttered and does not add Practice as a top-level marketing navbar item unless a specific product reason is documented.
- [ ] **NAV31-02**: Public Q&A remains a standalone categorized page for student, parent, teacher, pricing, account, and support questions instead of being mixed into Pricing.
- [ ] **NAV31-03**: Role app navigation uses clear labels and active-state wayfinding for student, parent, and tutor sections.
- [ ] **NAV31-04**: Cross-page Practice -> Chat -> Practice routes include visible page titles, context cues, and return actions.

### Four-Language Copy

- [ ] **I18N31-01**: English, German, French, and Italian copy exists for Practice-as-entry core message.
- [ ] **I18N31-02**: English, German, French, and Italian copy exists for `Continue Practice`.
- [ ] **I18N31-03**: English, German, French, and Italian copy exists for `Open Learning Chat`.
- [ ] **I18N31-04**: German labels remain short enough for buttons and large headings.
- [ ] **I18N31-05**: Four-language copy avoids literal translations that weaken the premium, calm education tone.

### Documentation, Demo, README, and Verification

- [ ] **DOC31-01**: `docs/ia/site-layout-with-practice-entry.md` exists and documents public, student, parent, and tutor structure.
- [ ] **DOC31-02**: `docs/ia/student-learning-entry-map.md` exists and documents Practice as student learning entry.
- [ ] **DOC31-03**: Practice docs exist for Practice-as-Chat-entry, Practice-to-Chat CTA rules, and Practice-to-teacher-support rules.
- [ ] **DOC31-04**: `docs/demo/practice-as-learning-chat-entry-demo.md` exists and explains the integrated demo flow.
- [ ] **DOC31-05**: QA checklist covers Practice-as-entry, site layout, product hierarchy, build, full demo flow, Practice-to-Chat, and Parent Report.
- [ ] **DOC31-06**: README includes a Phase 31 section explaining Practice Entry and Site Layout Integration.
- [ ] **QA31-01**: `npm run build` succeeds.
- [ ] **QA31-02**: Manual or browser verification confirms Homepage, Student Dashboard, Practice-to-Chat, Chat return, Tutor context, and Parent Report flow remain coherent.

## Future Requirements

### External Testing

- **TEST-FUTURE-01**: Run external student testing for the integrated Practice -> Learning Chat flow.
- **TEST-FUTURE-02**: Run external parent testing for unified learning activity and Parent Report clarity.
- **TEST-FUTURE-03**: Run external tutor testing for Practice-origin request context sufficiency.

### Production Backend

- **BACKEND-FUTURE-01**: Persist Practice progress, attempts, hints, Chat context, teacher requests, and report activity in a formal backend.
- **BACKEND-FUTURE-02**: Add auditable backend-owned Practice-to-Chat and Practice-to-teacher context records.

### Curriculum

- **CURRIC-FUTURE-01**: Expand beyond the equation demo only after the integrated flow validates with external users.
- **CURRIC-FUTURE-02**: Define a formal curriculum authoring and review workflow before adding broad content.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New Practice subjects or large curriculum expansion | Phase 31 is positioning and funnel integration, not content expansion. |
| Turning STOA into a game platform | Practice is an entry path; Learning Chat, teacher support, and parent visibility remain the main learning platform value. |
| Shop, gems, hearts, cartoon rewards, streak economy, or complex gamification | These conflict with STOA's premium education positioning and are outside the user brief. |
| Full Learning Chat rewrite | Phase 31 only adds Practice context and return flow where needed. |
| Full Parent Report rewrite | Phase 31 improves learning activity framing and components without rebuilding reporting architecture. |
| Production backend, database, CMS, or analytics pipeline | Frontend/demo-backed contracts remain sufficient for this milestone. |
| Formal teacher operations or scheduling | Tutor support remains a demo/product flow with context, not an operations platform. |
| Public navbar overcrowding with Practice | Practice is primarily a student app function; public marketing should stay focused. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| POS31-01 | Phase 165 | Planned |
| POS31-02 | Phase 165 | Planned |
| POS31-03 | Phase 165 | Planned |
| POS31-04 | Phase 165 | Planned |
| POS31-05 | Phase 165 | Planned |
| HOME31-01 | Phase 166 | Planned |
| HOME31-02 | Phase 166 | Planned |
| HOME31-03 | Phase 166 | Planned |
| HOME31-04 | Phase 166 | Planned |
| HOME31-05 | Phase 166 | Planned |
| DASH31-01 | Phase 167 | Planned |
| DASH31-02 | Phase 167 | Planned |
| DASH31-03 | Phase 167 | Planned |
| DASH31-04 | Phase 167 | Planned |
| DASH31-05 | Phase 167 | Planned |
| FLOW31-01 | Phase 167 | Planned |
| FLOW31-02 | Phase 167 | Planned |
| FLOW31-03 | Phase 167 | Planned |
| FLOW31-04 | Phase 167 | Planned |
| FLOW31-05 | Phase 167 | Planned |
| CHAT31-01 | Phase 167 | Planned |
| CHAT31-02 | Phase 167 | Planned |
| CHAT31-03 | Phase 167 | Planned |
| CHAT31-04 | Phase 167 | Planned |
| PARENT31-01 | Phase 168 | Planned |
| PARENT31-02 | Phase 168 | Planned |
| PARENT31-03 | Phase 168 | Planned |
| PARENT31-04 | Phase 168 | Planned |
| PARENT31-05 | Phase 168 | Planned |
| TUTOR31-01 | Phase 169 | Planned |
| TUTOR31-02 | Phase 169 | Planned |
| TUTOR31-03 | Phase 169 | Planned |
| TUTOR31-04 | Phase 169 | Planned |
| NAV31-01 | Phase 165 | Planned |
| NAV31-02 | Phase 165 | Planned |
| NAV31-03 | Phase 169 | Planned |
| NAV31-04 | Phase 167 | Planned |
| I18N31-01 | Phase 170 | Planned |
| I18N31-02 | Phase 170 | Planned |
| I18N31-03 | Phase 170 | Planned |
| I18N31-04 | Phase 170 | Planned |
| I18N31-05 | Phase 170 | Planned |
| DOC31-01 | Phase 165 | Planned |
| DOC31-02 | Phase 165 | Planned |
| DOC31-03 | Phase 170 | Planned |
| DOC31-04 | Phase 170 | Planned |
| DOC31-05 | Phase 170 | Planned |
| DOC31-06 | Phase 170 | Planned |
| QA31-01 | Phase 170 | Planned |
| QA31-02 | Phase 170 | Planned |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after v1.29 research and roadmap creation*
