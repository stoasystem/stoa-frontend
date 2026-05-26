# Learning Assistant Regression Report

## Summary

Phase 26 is ready for local demo use. The Learning Assistant behavior regression suite passes, the template fallback remains available, and backend smoke checks confirm student chat, teacher support, parent visibility, tutor resolution, billing, referral, support, and admin flows still work.

## Test Results

| Check | Result | Notes |
| --- | --- | --- |
| `npm install --ignore-scripts` | Passed | Dependencies were already up to date. |
| `python3 -m unittest discover -s demo-harness/tests` | Passed | 23 tests passed. |
| Backend syntax check | Passed | `main.py`, `seed.py`, and `reset_demo_data.py` compiled. |
| Student chat smoke | Passed | Template provider returned a guided equation response with no internal terms. |
| Teacher support smoke | Passed | Request created with `pending` status. |
| Parent history/summary smoke | Passed | Teacher request record appeared for the child. |
| Tutor request smoke | Passed | Detail loaded, status moved to `in_progress`, note added, status moved to `resolved`. |
| Billing/referral/support/admin smoke | Passed | Plans, checkout, referral, support ticket, and admin overview responded. |
| EN/DE/FR/IT language smoke | Passed | Template fallback responses were language-appropriate and internal-term-free. |
| `npm run lint` | Passed | No lint errors. |
| `npm run build` | Passed | Build completed; tooling emitted the existing Node `DEP0205` deprecation warning. |

## Regression Counts

| Category | Count |
| --- | ---: |
| Passed harness tests | 23 |
| Failed harness tests | 0 |
| Failure types observed | 0 |
| Provider used for deterministic QA | `template` |
| Fallback count in deterministic QA | Expected for template-mode checks |
| P0 behavior failures | 0 |
| Internal term leakage failures | 0 |
| Grade-scope failures | 0 |
| Subject-scope failures | 0 |
| Cheating behavior failures | 0 |

## Functional QA Coverage

| Area | Evidence |
| --- | --- |
| Relevance | `test_relevance.py` checks linear-equation relevance and generic-answer rejection. |
| Grade scope | `test_grade_scope.py` checks lower-secondary advanced-term rejection. |
| Subject scope | `test_subject_scope.py` checks gentle redirect for out-of-profile subjects. |
| Multi-turn context | `test_multi_turn_context.py` checks scenario data and follow-up context preservation. |
| Teacher escalation | `test_teacher_escalation.py` checks repeated confusion support path. |
| Internal terms | `test_internal_term_leakage.py` checks forbidden implementation terms. |
| Cheating behavior | `test_cheating_behavior.py` checks homework-copy redirection. |
| Existing provider behavior | `test_codex_provider_behavior.py` continues to pass from the repository root. |

## Demo Flow QA

| Flow | Result | Notes |
| --- | --- | --- |
| Student chat | Passed | Message order returns student and assistant messages. Loading/retry behavior is unchanged in frontend; backend returns completed messages. |
| Teacher request | Passed | Backend creates one request per call; frontend button remains disabled while requesting. |
| Parent record | Passed | Parent summary includes teacher request records without prompt/provider/debug details. |
| Tutor request detail | Passed | Tutor can view context, update status, add a note, and resolve the request. |
| Billing mock flow | Passed | Checkout session returns local success URL. |
| Referral | Passed | Referral endpoint returns parent referral data. |
| Support/contact | Passed | Support ticket creation works. |
| Admin overview | Passed | Admin analytics overview responds. |

## Known Issues

- No unresolved P0 behavior failures.
- `npm run build` still prints a Node `DEP0205` deprecation warning from the toolchain. It does not block the build.
- Phase 26 smokes are deterministic and use the template provider for repeatability. Live Codex quality still depends on local CLI availability and is guarded by fallback behavior.

## Readiness Decision

Ready for the local Phase 26 demo threshold. The system remains a local/demo Learning Assistant QA setup, not a production AI backend.

