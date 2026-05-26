# Phase 136 Plan: Full Demo QA, Readiness Checklist, README, and Handoff

## Goal

Complete Phase 25 documentation, QA evidence, and final verification.

## Tasks

- [x] Add Codex provider behavior QA document.
- [x] Add learning provider handoff document.
- [x] Update README with Phase 25 setup and boundaries.
- [x] Record provider readiness checklist.
- [x] Run harness tests.
- [x] Run backend smoke.
- [x] Run frontend build.

## Verification

- `PYTHONPATH=demo-harness python3 -m unittest discover -s demo-harness/tests`
- `PYTHONPATH=backend backend/.venv/bin/python -m py_compile backend/app/main.py backend/app/seed.py`
- local TestClient provider health/chat smoke
- `npm run build`

