# Phase 139 Plan

## Steps

1. Add focused evaluator helper functions for the required behavior dimensions.
2. Detect generic/irrelevant answers for core demo questions.
3. Detect direct-answer-first, internal terms, grade-scope violations, cheating, high-risk behavior, and context loss.
4. Tighten the repair prompt to preserve context and constraints.
5. Improve fallback responses for subject-scope, confusion, equation, quadratic, speed, cheating, and multilingual smoke scenarios.

## Verification

- `python3 -m unittest discover -s demo-harness/tests`

