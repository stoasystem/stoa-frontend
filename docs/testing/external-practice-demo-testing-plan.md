# External Practice Demo Testing Plan

## Purpose

Validate whether external users understand STOA's connected learning flow:

Practice -> hint -> Learning Chat -> teacher support -> Parent Report.

This plan prepares testing. It does not replace formal user research or production analytics.

## Tester Groups

| Group | Count | Goal |
|-------|-------|------|
| Students | 3-5 | Check whether the Practice and Learning Chat flow is understandable. |
| Parents | 2-3 | Check whether the report explains learning activity clearly. |
| Tutors or teachers | 1-2 | Check whether Practice-origin context is sufficient for support. |
| Internal reviewers | 1-2 | Check demo reliability and story clarity. |

## Session Format

Recommended length: 20-30 minutes per tester.

1. Briefly explain that the test is about the product flow, not the tester's math ability.
2. Give the tester the relevant task sheet.
3. Ask the tester to think aloud.
4. Do not explain the UI unless the tester is blocked.
5. Record confusion points, wording issues, and moments where the tester knows what to do next.
6. Complete the role-specific feedback questions after the task.

## Success Signals

- Student knows where to start.
- Student understands the hint.
- Student naturally understands why `Explain this step` opens Learning Chat.
- Parent can explain what the child practised.
- Parent understands the recommended next step.
- Tutor can see the student problem, topic, and recent answer.
- Internal reviewer can run the 3, 10, and 15 minute demo without story gaps.

## Setup Notes

Use the controlled demo environment and fixed test accounts prepared for STOA demos. The facilitator should reset data before sessions when needed and should avoid showing internal tooling or implementation details.

## Stop Conditions

Pause the session if:

- The tester cannot reach the intended role surface.
- The Practice lesson cannot be opened.
- Learning Chat does not preserve the practice context.
- Parent Report does not show learning activity.
- The tester sees internal implementation language.
