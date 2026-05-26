# Codex Provider Behavior QA

## Purpose

Phase 25 connects Codex as a local-only provider for the Learning Assistant inside the Python harness and demo backend. This QA checklist verifies that the demo remains reliable, guided, age-appropriate, and free of internal provider language.

## Provider Readiness Checklist

- [x] `codex` command is discoverable locally or the template fallback is enabled.
- [x] `STOA_DEMO_PROVIDER` can be set to `codex` or `template`.
- [x] `STOA_DEMO_PROVIDER_FALLBACK=template` is configured for local demos.
- [x] Provider timeout is bounded by `STOA_DEMO_PROVIDER_TIMEOUT_SECONDS`.
- [x] `GET /health/provider` returns selected provider, fallback provider, mode, and readiness.
- [x] Provider logs are written under `demo-harness/logs/` and excluded from git.
- [x] Logs avoid passwords, tokens, uploaded file contents, and full private transcripts.
- [x] Codex provider calls use an empty temporary working directory, scrubbed environment, ephemeral mode, ignored project rules, and read-only sandboxing where feasible.

## Behavior Checks

- [x] Harness can call the selected provider through the provider router.
- [x] Template fallback works when Codex is unavailable.
- [x] Forbidden internal terms are rejected by response checks.
- [x] Lower-secondary answers reject known calculus terms in regression checks.
- [x] Answers should guide the student before any final answer.
- [x] Out-of-subject questions are handled gently and point back to the saved learning scope.
- [x] Teacher support is suggested when the student is confused, asks for a teacher, or needs personalized review.
- [x] User-visible provider errors do not mention Codex, model, prompt, backend, demo, mock, or provider failure.

## Regression Set

Regression cases live in:

```text
demo-harness/data/demo_question_regression.json
```

Required cases are present:

- `lower_secondary_math_equation`
- `lower_secondary_quadratic_basic`
- `lower_secondary_physics_speed`
- `upper_secondary_function_graph`
- `out_of_grade_calculus`
- `out_of_subject_history`
- `confused_student_followup`
- `teacher_escalation_needed`

## Automated Verification

Run:

```bash
python3 -m unittest discover -s demo-harness/tests
```

Expected result:

```text
OK
```

## Local Backend Smoke

Run with deterministic fallback:

```bash
PYTHONPATH=backend:demo-harness STOA_DEMO_PROVIDER=template backend/.venv/bin/python -c "from fastapi.testclient import TestClient; from app.main import app; from app.reset_demo_data import reset_demo_data; reset_demo_data(); client=TestClient(app); health=client.get('/health/provider').json(); login=client.post('/auth/login', json={'email':'student@test.com','password':'password123'}); token=login.json()['accessToken']; headers={'Authorization':f'Bearer {token}'}; conv=client.get('/conversations', headers=headers).json()['items'][0]['id']; resp=client.post(f'/conversations/{conv}/messages', json={'content':'How do I solve 3x + 5 = 20?'}, headers=headers); data=resp.json(); assert health['ok'] is True; assert resp.status_code == 200; assert 'studentMessage' in data and 'assistantMessage' in data; assert 'Codex' not in data['assistantMessage']['content']; assert 'AI' not in data['assistantMessage']['content']; print('provider health and chat smoke passed')"
```

Expected result:

```text
provider health and chat smoke passed
```

## Full Demo Flow QA

Student:

- [x] Register or login as student.
- [x] Open chat.
- [x] Ask a lower-secondary math question.
- [x] Confirm a guided answer is returned.
- [x] Ask a confused follow-up.
- [x] Request professional teacher support.

Tutor:

- [x] Login as tutor.
- [x] View teacher request list.
- [x] Open request detail.
- [x] Mark in progress.
- [x] Add note.
- [x] Mark resolved.

Parent:

- [x] Login as parent.
- [x] View child learning history.
- [x] View report.
- [x] Confirm teacher request records appear.

Commercial/support/admin:

- [x] Open pricing.
- [x] Complete virtual checkout path.
- [x] Open referral page.
- [x] Submit support/contact request.
- [x] Open admin overview.

## Known Limits

- This is not a production provider architecture.
- Response checks are deterministic demo guardrails, not a full safety platform.
- Template fallback is intentionally generic and prioritizes demo continuity.
- Future production integration should use a backend-owned provider API with formal monitoring, safety, billing, and structured output controls.
