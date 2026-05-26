# Phase 134 Plan: Prompt Rules, Response Checks, and Behavior Regression

## Goal

Create prompt and response behavior controls for the local demo Learning Assistant.

## Tasks

- [x] Add prompt templates for base behavior, grade rules, subject rules, and teacher escalation.
- [x] Add prompt builder with student profile and conversation context.
- [x] Add response evaluator and one-shot repair/fallback orchestration.
- [x] Add demo regression question set.
- [x] Add behavior tests using standard-library unittest.

## Verification

- Run `PYTHONPATH=demo-harness python3 -m unittest discover -s demo-harness/tests`.

