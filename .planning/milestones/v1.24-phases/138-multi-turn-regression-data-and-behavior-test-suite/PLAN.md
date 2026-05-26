# Phase 138 Plan

## Steps

1. Add multi-turn JSON scenarios for all eight required behavior cases.
2. Add focused Python unittest modules for relevance, grade scope, subject scope, context consistency, teacher escalation, internal terms, and cheating behavior.
3. Keep tests runnable from the repository root.
4. Use failure reason names that map to the Phase 26 bug reproduction log.

## Verification

- `python3 -m unittest discover -s demo-harness/tests`

