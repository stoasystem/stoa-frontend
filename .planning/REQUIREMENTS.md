# Requirements: STOA Frontend v2.4

## v2.4 Requirements

### Learning Entry Hierarchy

- [ ] **LEH-01**: Student Dashboard presents the main learning flow as prioritized sections instead of a flat feature grid.
- [ ] **LEH-02**: Student Dashboard primary action is Continue Practice Path / Continue Learning with one clear primary CTA.
- [ ] **LEH-03**: Student Dashboard separates Today's Practice, Need Help, Live Support, and Recent Activity into scannable sections.
- [ ] **LEH-04**: Student Dashboard includes Practice Library and Mistakes to Review as practice-oriented actions with supportive copy.
- [ ] **LEH-05**: Student Dashboard includes Learning Assistant and Upload a Question as help-oriented actions with distinct purposes.
- [ ] **LEH-06**: Student Dashboard includes Online Classroom and Tutor Support without making them compete visually with the primary learning action.
- [ ] **LEH-07**: Student navigation and top-level labels use Practice Library where students previously saw Question Bank, while routes may remain `/question-bank`.
- [ ] **LEH-08**: Mobile Student Dashboard ordering prioritizes Continue Learning, Need Help, Today's Practice, Live Support, and Recent Activity.

### Practice Library Refinement

- [ ] **PLR-01**: Student-facing Question Bank home title changes to Practice Library with subtitle "Choose exercises by subject, topic, and difficulty."
- [ ] **PLR-02**: Practice Library home orders content as Continue Practice, Find Exercises, Recommended for You, Review & Improve, and All Subjects.
- [ ] **PLR-03**: Practice Library recommended and empty states distinguish recommended-to-start from based-on-history recommendations.
- [ ] **PLR-04**: Question set cards present concise learning metadata: title, description, question count, difficulty, estimated time, skills, and correct primary action.
- [ ] **PLR-05**: In-progress question set cards show progress and Resume rather than generic Start.
- [ ] **PLR-06**: Completed question set cards use Practice Again and Review Mistakes instead of punitive copy.
- [ ] **PLR-07**: Question session pages use calm labels such as Your answer, Check Answer, Skip for Now, Correct, Not quite, Explanation, and Ask Learning Assistant.
- [ ] **PLR-08**: Question feedback avoids Wrong, Failed, weak student, and other punitive language.
- [ ] **PLR-09**: Question result pages highlight Score, Accuracy, Time, What went well, Needs review, and Next steps.
- [ ] **PLR-10**: Mistakes review empty and populated states use No mistakes to review yet, Review questions you missed before, and Start Practice / Review Mistakes actions.
- [ ] **PLR-11**: Practice Library, session, result, and mistakes pages remain usable on mobile without squeezing sidebars or excessive metadata.

### Upload And Chat Trust Copy

- [ ] **UCT-01**: Upload entry points consistently use Upload a Question, Take Photo, Attach PDF, and Attach File.
- [ ] **UCT-02**: Upload UI avoids Photo Solver, AI Solver, Instant Solve, Scan and Solve, and image-recognition claims.
- [ ] **UCT-03**: Upload modal explains that students can take a photo or attach a PDF from schoolwork and ask the Learning Assistant step by step.
- [ ] **UCT-04**: Upload modal and inline panels include supported formats, maximum size, attached files, privacy note, and recovery actions.
- [ ] **UCT-05**: Upload success copy says File ready and Ask Learning Assistant without implying recognition or solving.
- [ ] **UCT-06**: Upload errors are specific and recoverable for unsupported type, too large, too many files, failed upload, and empty file.
- [ ] **UCT-07**: Chat attachment display stays concise and avoids claiming the assistant has read or solved uploaded images.
- [ ] **UCT-08**: Learning Assistant copy remains step-by-step guidance, not AI teacher or perfect answer language.
- [ ] **UCT-09**: Chat teacher support states cover Tutor support requested, Tutor joined, Learning Assistant observing, Start Live Classroom, and Live classroom completed.
- [ ] **UCT-10**: Chat and help CTAs consistently use Ask Learning Assistant, Ask a Tutor, and Start Live Classroom.

### Online Classroom Refinement

- [ ] **OCR-01**: Online Classroom remains the primary visible module name on dashboard, home, schedule, lobby, room, and summary surfaces.
- [ ] **OCR-02**: Classroom home explains the support ladder: start with Learning Assistant, tutor can join by text, live classroom is for deeper help.
- [ ] **OCR-03**: Classroom home separates Upcoming Session, Get Help Now, Schedule a Session, and Recent Sessions.
- [ ] **OCR-04**: Schedule Classroom form presents subject, topic, level, language, session type, time, tutor context, and materials in a clear order.
- [ ] **OCR-05**: Schedule session type copy explains Quick Help, Standard Session, and Deep Review by use case, not duration alone.
- [ ] **OCR-06**: Lobby foregrounds correct classroom confirmation: title, time, tutor, languages, topic, source, materials, and before-you-join device state.
- [ ] **OCR-07**: Lobby waiting/not-open/completed states give clear next steps and avoid implying real provider connection.
- [ ] **OCR-08**: Classroom room defaults to learning context: shared problem/materials are prominent, video placeholders stay honest, and side panels are clearly labeled.
- [ ] **OCR-09**: Classroom room control copy uses Mute, Unmute, Start Video, Stop Video, Share Material, Whiteboard, Chat, Notes, Leave, and End Session.
- [ ] **OCR-10**: Classroom summary emphasizes What we reviewed, Materials, Recommended next steps, View Summary, and Back to Dashboard.
- [ ] **OCR-11**: Classroom UI avoids user-facing Zoom, meeting, real stream, recording, screen-share, billing, and provider-specific claims.
- [ ] **OCR-12**: Mobile classroom layout avoids a fixed squeezed right panel and keeps teacher video, shared problem, bottom controls, and panel tabs usable.

### Tutor And Parent Context

- [ ] **TPC-01**: Tutor Dashboard and queue cards emphasize student need, topic, source, waiting/status, context, materials, and actions.
- [ ] **TPC-02**: Tutor queue uses Review Context / Open Lobby / Join Classroom labels consistently.
- [ ] **TPC-03**: Tutor lobby shows student, level, language, topic, why the student needs help, attached materials, and suggested focus.
- [ ] **TPC-04**: Tutor room defaults to notes-oriented workflow and exposes Save Notes and End Session semantics.
- [ ] **TPC-05**: Tutor copy is operational and context-rich rather than promotional.
- [ ] **TPC-06**: Parent Dashboard includes a lightweight Learning Support section summarizing practice, uploaded questions, tutor support, and classroom activity.
- [ ] **TPC-07**: Parent classroom copy explains that the child joins from the student dashboard and does not expose parent observer or classroom-control claims.
- [ ] **TPC-08**: Parent surfaces explain STOA as practice, assistant support, tutor support, and classroom support rather than a simple AI chat.

### Shared States, I18n, Accessibility, And QA

- [ ] **SQA-01**: Existing shared PageHeader, SectionHeader, EmptyState, and ErrorState patterns are reused or extended rather than duplicated.
- [ ] **SQA-02**: New ContextCard, NextStepCard, StatusPill, or MetadataList patterns are added only where they reduce duplication and clarify cross-module context.
- [ ] **SQA-03**: Empty states include title, description, and a next action.
- [ ] **SQA-04**: Error states include title/description where possible and a recovery action such as Try Again, Back to Dashboard, or Back to Practice Library.
- [ ] **SQA-05**: Loading states include contextual text such as Loading your classroom or Loading practice sets rather than spinner-only UI.
- [ ] **SQA-06**: CTA naming is consistent across modules: Open Practice Path, Open Practice Library, Review Mistakes, Ask Learning Assistant, Upload a Question, Ask a Tutor, Start Live Classroom, Schedule a Session, Join Lobby, Join Classroom, View Summary, Back to Dashboard.
- [ ] **SQA-07**: `questionBank`, `uploads`, `liveClassroom`, `chat`, dashboard, tutor, and parent i18n keys cover refined copy without excessive hard-coded English.
- [ ] **SQA-08**: German, French, and Italian copy remains initial-quality and is marked for native review where needed.
- [ ] **SQA-09**: Each touched page keeps one unique h1, sensible heading hierarchy, keyboard-reachable CTAs, and clear accessible names for icon/control buttons.
- [ ] **SQA-10**: Feedback, upload errors, and classroom status changes use role alert or aria-live where appropriate.
- [ ] **SQA-11**: Correct/incorrect/active/disabled states are not communicated by color alone.
- [ ] **SQA-12**: High-risk user-facing terms are removed or justified: AI teacher, human fallback, instant solution, perfect answer, failed questions, weak student, scan and solve, guaranteed, Zoom.
- [ ] **SQA-13**: Playwright coverage verifies Student Dashboard clarity, Practice Library naming, Upload trust wording, Chat-to-classroom wording, Classroom layout, and relevant empty/error states.
- [ ] **SQA-14**: `npm run lint` passes after the refinement.
- [ ] **SQA-15**: `npm run build` passes after the refinement.

## Future Requirements

| Requirement | Reason Deferred |
|-------------|-----------------|
| Production OCR or image understanding | v2.4 only improves upload trust copy and handoff behavior. |
| Real WebRTC/video provider integration | v2.4 refines classroom UI wording and layout only. |
| Real scheduling availability or tutor matching | Requires backend/product architecture outside this refinement milestone. |
| Full admin classroom operations | v2.4 focuses on student, tutor, and parent clarity. |
| Full component library redesign | Existing STOA design system remains in place; only shared patterns may be extended. |
| Native professional translation review | v2.4 can improve and mark German/French/Italian copy, but native review is a later process. |
| New large routes or business modules | v2.4 is not an expansion milestone. |

## Out of Scope

| Item | Reason |
|------|--------|
| New production backend services | This milestone is UI/copy/experience refinement only. |
| Real OCR, handwriting recognition, or image solving | Upload remains a context handoff to Learning Assistant. |
| Real WebRTC, device streams, recording, transcription, screen sharing, or billing | Online Classroom remains frontend/mock-backed. |
| Major visual redesign, new color system, new typography direction, or animation overhaul | v2.4 must remain consistent with the existing STOA visual system. |
| Replacing `/question-bank` routes or internal module names | Student copy can say Practice Library while code/routes remain stable. |
| Punitive scoring or exam-first language | STOA should remain calm, supportive, and learning-centered. |
| Parent observer mode or parent classroom controls | Parent visibility remains summary-level and informational. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LEH-01 | 219 | Pending |
| LEH-02 | 219 | Pending |
| LEH-03 | 219 | Pending |
| LEH-04 | 219 | Pending |
| LEH-05 | 219 | Pending |
| LEH-06 | 219 | Pending |
| LEH-07 | 219 | Pending |
| LEH-08 | 219 | Pending |
| PLR-01 | 220 | Pending |
| PLR-02 | 220 | Pending |
| PLR-03 | 220 | Pending |
| PLR-04 | 220 | Pending |
| PLR-05 | 220 | Pending |
| PLR-06 | 220 | Pending |
| PLR-07 | 220 | Pending |
| PLR-08 | 220 | Pending |
| PLR-09 | 220 | Pending |
| PLR-10 | 220 | Pending |
| PLR-11 | 220 | Pending |
| UCT-01 | 221 | Pending |
| UCT-02 | 221 | Pending |
| UCT-03 | 221 | Pending |
| UCT-04 | 221 | Pending |
| UCT-05 | 221 | Pending |
| UCT-06 | 221 | Pending |
| UCT-07 | 221 | Pending |
| UCT-08 | 221 | Pending |
| UCT-09 | 221 | Pending |
| UCT-10 | 221 | Pending |
| OCR-01 | 222 | Pending |
| OCR-02 | 222 | Pending |
| OCR-03 | 222 | Pending |
| OCR-04 | 222 | Pending |
| OCR-05 | 222 | Pending |
| OCR-06 | 222 | Pending |
| OCR-07 | 222 | Pending |
| OCR-08 | 222 | Pending |
| OCR-09 | 222 | Pending |
| OCR-10 | 222 | Pending |
| OCR-11 | 222 | Pending |
| OCR-12 | 222 | Pending |
| TPC-01 | 223 | Pending |
| TPC-02 | 223 | Pending |
| TPC-03 | 223 | Pending |
| TPC-04 | 223 | Pending |
| TPC-05 | 223 | Pending |
| TPC-06 | 223 | Pending |
| TPC-07 | 223 | Pending |
| TPC-08 | 223 | Pending |
| SQA-01 | 224 | Pending |
| SQA-02 | 224 | Pending |
| SQA-03 | 224 | Pending |
| SQA-04 | 224 | Pending |
| SQA-05 | 224 | Pending |
| SQA-06 | 224 | Pending |
| SQA-07 | 224 | Pending |
| SQA-08 | 224 | Pending |
| SQA-09 | 224 | Pending |
| SQA-10 | 224 | Pending |
| SQA-11 | 224 | Pending |
| SQA-12 | 224 | Pending |
| SQA-13 | 224 | Pending |
| SQA-14 | 224 | Pending |
| SQA-15 | 224 | Pending |

**Total requirements:** 64
**Mapped requirements:** 64
**Unmapped requirements:** 0

*Last updated: 2026-06-02 after v2.4 requirements definition*
