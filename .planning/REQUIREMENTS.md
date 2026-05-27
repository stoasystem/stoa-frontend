# Requirements: STOA Frontend

**Defined:** 2026-05-27
**Milestone:** v1.31 Phase 33: Homepage Practice Entry Clarification and Learning Platform Funnel Optimization
**Core Value:** Developers can run STOA as a credible learning platform where homepage visitors can clearly start a short Practice path, get Learning Chat help when stuck, escalate to professional teacher support when needed, and preserve parent visibility without making STOA look like only a game.

## v1 Requirements

### Funnel and Routing

- [x] **NAV33-01**: Visitor can identify a clear homepage `Start Practice` action for the Practice Game / Practice Path entry.
- [x] **NAV33-02**: Unauthenticated user who clicks `Start Practice` is routed to `/login?next=/practice`.
- [x] **NAV33-03**: Student who is already authenticated and clicks `Start Practice` is routed directly to `/practice`.
- [x] **NAV33-04**: Parent who is already authenticated and clicks `Start Practice` is routed to `/parent` instead of the student-only Practice route.
- [x] **NAV33-05**: Tutor who is already authenticated and clicks `Start Practice` is routed to `/tutor` instead of the student-only Practice route.
- [x] **NAV33-06**: Admin who is already authenticated and clicks `Start Practice` is routed to `/admin` instead of the student-only Practice route.
- [x] **NAV33-07**: Student login from `/login?next=/practice` lands on `/practice` when the next path is safe for the student role.
- [x] **NAV33-08**: Registration path documentation covers `/register?role=student&next=/practice` and the expected post-registration Practice destination.
- [x] **NAV33-09**: A shared navigation helper such as `startPracticeNavigation` or `getStartPracticePath` centralizes Start Practice route decisions.

### Homepage Practice Entry UI

- [ ] **HOME33-01**: Homepage includes a high-visibility Practice Game / Practice Path section after Hero and before or inside the broader How STOA Works flow.
- [ ] **HOME33-02**: Practice entry is visually clearer than a plain explanatory block but does not overpower the Hero or main `Start Learning` CTA.
- [ ] **HOME33-03**: `HomePracticeEntry` renders the complete homepage Practice entry section using existing STOA premium theme patterns.
- [ ] **HOME33-04**: `PracticeEntryCard` renders the clickable Practice entry, short explanation, and Start Practice CTA.
- [ ] **HOME33-05**: `HomePracticePreview` renders a concise equation-path preview without expanding curriculum content.
- [ ] **HOME33-06**: Practice preview includes the equation path topics: one-step equations, quadratic basics, and linear systems.
- [ ] **HOME33-07**: Practice entry copy explains that students start with a short equation challenge.
- [ ] **HOME33-08**: Practice entry copy explains that hints appear before Learning Chat when a student is stuck or makes a mistake.
- [ ] **HOME33-09**: Practice entry copy preserves the sequence Practice -> Learning Chat -> Professional Teacher Support -> Parent Report.
- [ ] **HOME33-10**: Practice entry avoids user-facing phrases such as `Duolingo-style`, `AI game`, `Play now`, `gamified AI platform`, XP, streaks, hearts, gems, shops, and leaderboards.
- [ ] **HOME33-11**: Homepage CTA hierarchy keeps `Start Learning` as the page-level primary CTA, `Start Practice` as a clear entry CTA, and `How it works` as secondary.

### Localization, Copy, and Layout Fit

- [ ] **L10N33-01**: English Practice entry copy includes `Practice Game`, `Start with a short equation challenge`, and `Start Practice` wording or approved equivalents.
- [ ] **L10N33-02**: German Practice entry copy includes `Übungsweg`, short equation-practice wording, and `Übung starten` wording or approved equivalents that fit UI.
- [ ] **L10N33-03**: French Practice entry copy includes `Parcours d’entraînement`, short equation-practice wording, and `Commencer l’entraînement` wording or approved equivalents that fit UI.
- [ ] **L10N33-04**: Italian Practice entry copy includes `Percorso di pratica`, short equation-practice wording, and `Inizia la pratica` wording or approved equivalents that fit UI.
- [ ] **L10N33-05**: Practice preview topic labels are localized for English, German, French, and Italian.
- [ ] **L10N33-06**: German and French Practice entry CTAs wrap or shorten safely on mobile without shrinking typography.
- [ ] **L10N33-07**: Homepage Practice entry does not create horizontal overflow at 320, 375, 430, 768, 1024, or 1440 CSS px where feasible.
- [ ] **L10N33-08**: Practice entry hover and reveal effects respect reduced-motion preferences.

### Documentation and Demo Flow

- [ ] **DOC33-01**: `docs/home/practice-entry-section.md` documents the homepage Practice entry section strategy and product hierarchy.
- [ ] **DOC33-02**: `docs/home/homepage-cta-hierarchy.md` documents `Start Learning`, `Start Practice`, and `How it works` hierarchy.
- [ ] **DOC33-03**: `docs/practice/practice-homepage-entry.md` documents how the homepage Practice entry connects to `/practice`.
- [ ] **DOC33-04**: `docs/practice/practice-entry-copy.md` records the four-language Practice entry copy and forbidden wording.
- [ ] **DOC33-05**: `docs/ia/homepage-learning-entry-map.md` maps Hero, Practice, How STOA Works, Learning Chat, teacher support, and Parent Report.
- [ ] **DOC33-06**: `docs/demo/homepage-to-practice-demo-flow.md` documents the homepage-to-Practice demo flow for unauthenticated and authenticated users.
- [ ] **DOC33-07**: README includes a Phase 33 section explaining the Practice homepage entry, route behavior, four-language copy, QA, and build status.

### QA, Verification, and Handoff

- [ ] **QA33-01**: QA checklist verifies that homepage has a clear Practice Game / Practice Path entry and Start Practice button.
- [ ] **QA33-02**: QA checklist verifies that users can understand Practice as a short learning entry and not as the whole STOA product.
- [ ] **QA33-03**: QA checklist verifies unauthenticated, student, parent, tutor, and admin Start Practice routing.
- [ ] **QA33-04**: QA checklist verifies desktop and mobile Practice entry layout across English, German, French, and Italian.
- [ ] **QA33-05**: QA checklist verifies Practice -> Learning Chat -> Professional Teacher Support -> Parent Report hierarchy.
- [ ] **QA33-06**: Homepage-to-Practice demo flow is run or documented with exact manual verification steps.
- [ ] **QA33-07**: `npm run build` succeeds after Phase 33 changes.
- [ ] **QA33-08**: Phase 33 handoff records any known gaps for Phase 34 user testing and feedback.

## Future Requirements

### User Testing and Feedback

- **TEST34-01**: Run student testing to confirm users understand and click the homepage Start Practice entry.
- **TEST34-02**: Run parent testing to confirm Practice plus Parent Report improves trust without making STOA feel like only a game.
- **TEST34-03**: Run teacher testing to confirm Practice-origin context helps professional support.
- **TEST34-04**: Decide whether homepage Practice entry needs further optimization based on external user feedback.

### Analytics and Product Learning

- **ANALYTICS-FUTURE-01**: Add privacy-safe events for homepage Start Practice clicks, Practice preview visibility, hint usage, and Practice-to-Learning-Chat handoff if analytics becomes in scope.
- **ANALYTICS-FUTURE-02**: Add funnel reporting for homepage -> login/register -> Practice activation after product tracking and privacy review.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New Practice subjects | Phase 33 clarifies entry and funnel; it does not expand curriculum. |
| New Practice lessons or large question bank | Existing equation demo content is enough for the homepage preview and route flow. |
| Practice internal interaction redesign | Phase 33 focuses on homepage entry, CTA routing, copy, docs, and QA. |
| Learning Chat rebuild | Learning Chat remains the explanation surface; this phase only clarifies the handoff. |
| Parent Report redesign | Parent Report remains the visibility layer; this phase only keeps it in the product hierarchy. |
| Formal backend, database, CMS, payment, or production analytics work | The funnel problem is frontend IA, routing, copy, and QA. |
| Complex gamification | STOA should use short-session clarity and gentle progress, not XP, streak pressure, hearts, gems, shops, leaderboards, or reward economies. |
| Duolingo visual or brand imitation | Duolingo is only a mechanism reference; STOA must retain its own premium education brand. |
| Public top-level Practice navbar item | Practice belongs as a homepage entry and authenticated student action unless future IA evidence says otherwise. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV33-01 | Phase 177 | Complete |
| NAV33-02 | Phase 177 | Complete |
| NAV33-03 | Phase 177 | Complete |
| NAV33-04 | Phase 177 | Complete |
| NAV33-05 | Phase 177 | Complete |
| NAV33-06 | Phase 177 | Complete |
| NAV33-07 | Phase 177 | Complete |
| NAV33-08 | Phase 177 | Complete |
| NAV33-09 | Phase 177 | Complete |
| HOME33-01 | Phase 178 | Pending |
| HOME33-02 | Phase 178 | Pending |
| HOME33-03 | Phase 178 | Pending |
| HOME33-04 | Phase 178 | Pending |
| HOME33-05 | Phase 178 | Pending |
| HOME33-06 | Phase 178 | Pending |
| HOME33-07 | Phase 178 | Pending |
| HOME33-08 | Phase 178 | Pending |
| HOME33-09 | Phase 178 | Pending |
| HOME33-10 | Phase 178 | Pending |
| HOME33-11 | Phase 178 | Pending |
| L10N33-01 | Phase 179 | Pending |
| L10N33-02 | Phase 179 | Pending |
| L10N33-03 | Phase 179 | Pending |
| L10N33-04 | Phase 179 | Pending |
| L10N33-05 | Phase 179 | Pending |
| L10N33-06 | Phase 179 | Pending |
| L10N33-07 | Phase 179 | Pending |
| L10N33-08 | Phase 179 | Pending |
| DOC33-01 | Phase 180 | Pending |
| DOC33-02 | Phase 180 | Pending |
| DOC33-03 | Phase 180 | Pending |
| DOC33-04 | Phase 180 | Pending |
| DOC33-05 | Phase 180 | Pending |
| DOC33-06 | Phase 180 | Pending |
| DOC33-07 | Phase 180 | Pending |
| QA33-01 | Phase 180 | Pending |
| QA33-02 | Phase 180 | Pending |
| QA33-03 | Phase 180 | Pending |
| QA33-04 | Phase 180 | Pending |
| QA33-05 | Phase 180 | Pending |
| QA33-06 | Phase 180 | Pending |
| QA33-07 | Phase 180 | Pending |
| QA33-08 | Phase 180 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-05-27 after Phase 33 milestone initialization*
