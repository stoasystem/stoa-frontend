# Phase 81 Plan: Demo Data Seed and Reset Stabilization

## Goal

Normalize fixed demo accounts, demo data, and reset behavior.

## Tasks

- [x] Add demo support ticket and billing-interest tables.
- [x] Seed support tickets, billing interest, extra teacher-help request states, and message attachment linkage.
- [x] Preserve deterministic reset through `backend/app/reset_demo_data.py`.
- [x] Add npm demo backend/reset scripts.

## Verification

- [x] `python3 -m py_compile backend/app/*.py` passes.
- [x] `cd backend && PYTHONPATH=. python3 -m app.reset_demo_data` resets local demo data.

