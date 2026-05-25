# Pilot Launch Plan

## Pilot Goal

Validate that a small group of real STOA users can use the product safely and productively before a public launch.

The pilot should answer:

- Do students return to AI chat when they have learning questions?
- Do students understand when to request teacher help?
- Do parents understand the value and limits of child reports?
- Can tutors review and resolve help requests without operational confusion?
- Can the team monitor errors, usage, feedback, and support issues during real use?

## Pilot Group

Recommended first pilot:

- Students: 5-10
- Parents: 3-5
- Tutors: 1-3
- Duration: 1-2 weeks

Pilot users should be invited manually or through a controlled invite-code flow. Do not open public registration before the team confirms support, monitoring, privacy, and backup readiness.

## User Types

### Students

Students should complete at least one learning chat, try one uploaded homework file if appropriate, and request teacher help when the AI answer is not enough.

### Parents

Parents should review child summary and weekly report pages, then answer whether the report is clear and useful for understanding learning progress.

### Tutors

Tutors should review the request list, open request detail, add notes where useful, and update status through the expected workflow.

## Timeline

1. Setup day: configure pilot environment, seed or create accounts, confirm support channel, and run the launch checklist.
2. Pilot days 1-3: watch for critical bugs, login issues, and broken core flows.
3. Pilot days 4-10: collect learning behavior, parent feedback, tutor workflow notes, and support issues.
4. Review day: compile analytics, feedback, bugs, and support requests into the post-pilot report.

## Success Metrics

- At least 70% of students complete one chat.
- At least 50% of students upload a question file.
- At least 30% of students request teacher help.
- At least 70% of parents can explain what the child report means.
- At least one tutor fully handles a help request from open to resolved.
- Critical bug count is 0, or every critical bug is fixed or mitigated within 24 hours.

## Pilot Tasks

Students:

- Login.
- Open `/onboarding`.
- Open `/chat`.
- Ask one learning question.
- Upload one homework image or PDF if they have one.
- Request teacher help if they need human review.
- Submit feedback or support if confused.

Parents:

- Login.
- Open `/onboarding`.
- Open `/parent`.
- Review child summary and weekly report.
- Submit feedback about clarity and trust.

Tutors:

- Login.
- Open `/onboarding`.
- Open `/tutor`.
- Review request list and request detail.
- Update a request status.
- Add notes if needed.

## Feedback Method

Use the in-app feedback entry for product feedback and `/support` for account, technical, billing-placeholder, or learning-support questions.

Feedback should be triaged daily into:

- Critical bug
- Product confusion
- Learning quality concern
- Parent visibility concern
- Tutor workflow issue
- Pricing or subscription question

## Support Method

Support requests should include the request type, current page, user role if available, and a concise message. The support workflow is documented in `docs/operations/support-workflow.md`.

Response target for pilot:

- Critical account or data access issue: same day.
- Technical blocker: within 24 hours.
- Product feedback: reviewed during daily triage.
- Pricing/subscription question: acknowledge and explain billing is unavailable during pilot.

## Risks and Handling

| Risk | Handling |
|------|----------|
| Login or role-routing failure | Keep seed/manual accounts ready and verify `/auth/me` before launch. |
| AI answer quality issue | Remind users AI can be wrong and route unresolved questions to teacher help. |
| Sensitive upload | Tell users not to upload highly sensitive files during pilot. |
| Parent sees wrong child data | Treat as critical; stop affected access until backend authorization is verified. |
| Tutor workflow unclear | Use onboarding and support feedback to simplify the request workflow. |
| Analytics or monitoring outage | Continue pilot only if core product works; manually collect feedback until telemetry is restored. |

## Retrospective

At the end of the pilot, complete `docs/pilot/pilot-feedback-report-template.md` and decide:

- Continue pilot with fixes.
- Start Phase 10 payment/pre-launch preparation.
- Pause and repair critical product, privacy, or operational gaps.
