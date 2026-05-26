# Phase 140 Plan

## Steps

1. Run install, harness, backend syntax, backend smoke, language smoke, lint, and build verification.
2. Verify student chat, teacher request, parent record, tutor detail/note/status, billing, referral, support, and admin flows through backend smokes.
3. Document pass/fail counts, fallback mode, P0 count, known issues, and readiness decision.
4. Update README with Phase 26 QA instructions.
5. Mark Phase 26 requirements complete after verification.

## Verification

- `npm install --ignore-scripts`
- `python3 -m unittest discover -s demo-harness/tests`
- `PYTHONPATH=backend backend/.venv/bin/python -m py_compile backend/app/main.py backend/app/seed.py backend/app/reset_demo_data.py`
- Backend TestClient smoke checks
- Template fallback multilingual smoke
- `npm run lint`
- `npm run build`

