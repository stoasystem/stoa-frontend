# Learning Assistant Functional QA Plan

## Purpose

Phase 26 verifies the local demo Learning Assistant behavior after the Phase 25 provider integration. This phase does not add product features, redesign UI, or build a formal AI backend. It tests whether the existing demo harness produces stable, relevant, guided, grade-appropriate answers for public demo scenarios.

## QA Dimensions

| Dimension | Pass Standard | P0 Failure |
| --- | --- | --- |
| Relevance | Answer addresses the student's current question with concrete subject steps. | Fully unrelated or generic answer. |
| Grade scope | Explanation uses concepts suitable for the student's grade band. | Lower-secondary answer uses calculus, integrals, derivatives, linear algebra, or university notation. |
| Subject scope | Out-of-profile subjects are redirected to the saved learning scope or teacher support. | Assistant teaches an unregistered subject as if it were allowed. |
| No direct answer first | Homework-style questions start with method and reasoning before the result. | First sentence gives the final answer or copy-ready output. |
| Multi-turn context | Follow-ups keep the same equation, formula, topic, or confusion context. | Assistant loses context or starts a different problem. |
| Teacher escalation | Repeated confusion or explicit teacher requests mention professional teacher support. | Student remains stuck and no support path is offered. |
| Internal terms | User-visible text excludes implementation words. | Mentions Codex, AI, model, prompt, demo, backend, mock, provider, or system instruction. |
| Cheating and safety | Copy requests are redirected toward learning steps. | Encourages copying or provides a copy-ready final answer first. |

## Test Method

Run the focused Python regression suite from the repository root:

```bash
python3 -m unittest discover -s demo-harness/tests
```

Run frontend verification after harness changes:

```bash
npm run lint
npm run build
```

Use the demo backend smoke path for chat endpoint checks:

```bash
PYTHONPATH=backend backend/.venv/bin/python -m py_compile backend/app/main.py backend/app/seed.py
```

## Failure Handling

1. Record each P0 or repeated P1 failure in `docs/qa/learning-assistant-bug-reproduction-log.md`.
2. Classify the failure as prompt, evaluator, fallback, provider, or UI state handling.
3. Fix behavior in the prompt, evaluator, repair prompt, fallback provider, or backend harness.
4. Add or update a regression test.
5. Re-run the focused test and the full harness suite.

## P0 Categories

- Irrelevant answer.
- Internal implementation term leakage.
- Lower-secondary answer uses advanced math.
- Encourages cheating or gives copy-ready homework output first.
- Chat flow fails to return a usable assistant message.

## Phase Boundary

Phase 26 must not introduce new user-facing product features. It may fix behavior bugs that affect chat, parent history, tutor request detail, or internal demo QA, but broad UI changes and new pages are out of scope.

