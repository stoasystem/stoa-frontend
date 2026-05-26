# Practice Demo Feedback Evaluation

This document explains how to turn feedback into useful follow-up work.

## Feedback Categories

| Category | What To Look For |
|----------|------------------|
| Clarity | Tester understands what STOA does and what to do next. |
| Ease of use | Tester can move through the flow without facilitator help. |
| Learning value | Student or tutor sees educational usefulness. |
| Trust | Parent or stakeholder believes the support model is credible. |
| Parent visibility | Parent understands what happened and what comes next. |
| Teacher support | Teacher escalation feels helpful and not too early. |
| Visual design | UI feels calm, credible, and readable. |
| Language clarity | Labels and explanations are understandable in the selected locale. |
| Confusing moments | Specific steps that caused hesitation or wrong interpretation. |
| Suggestions | Concrete changes the tester proposes. |

## Severity

| Severity | Meaning | Action |
|----------|---------|--------|
| P0 | Demo cannot continue or core story breaks. | Fix before next external demo. |
| P1 | Tester misunderstands a core value or cannot complete a main task without help. | Prioritize for Phase 31. |
| P2 | Friction, unclear wording, or visual issue that does not break the demo. | Add to backlog with context. |
| P3 | Nice-to-have, preference, or future expansion idea. | Track only if repeated. |

## Triage Template

For each finding, capture:

- Observation
- Tester role
- Page or step
- Severity
- Evidence or quote
- Suggested follow-up
- Phase 31 candidate: yes/no
- Future backend/curriculum candidate: yes/no

## Decision Rules

- Repeated confusion from students is stronger evidence than a single preference.
- Parent misunderstanding of the report is a high-priority product-story issue.
- Tutor requests for more context should be separated into frontend display issues and future backend data requirements.
- Requests for new subjects belong in future curriculum requirements unless they block understanding of the equation demo.
- Requests for production persistence belong in backend handoff, not Phase 30.
