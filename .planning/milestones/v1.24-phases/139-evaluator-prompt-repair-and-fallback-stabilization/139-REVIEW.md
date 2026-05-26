---
phase: 139-evaluator-prompt-repair-and-fallback-stabilization
reviewed: 2026-05-26T16:06:05Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - demo-harness/harness/build_prompt.py
  - demo-harness/harness/evaluate_response.py
  - demo-harness/harness/providers/template_provider.py
  - demo-harness/harness/run_learning_assistant.py
  - demo-harness/tests/test_cheating_behavior.py
  - demo-harness/tests/test_grade_scope.py
  - demo-harness/tests/test_internal_term_leakage.py
  - demo-harness/tests/test_multi_turn_context.py
  - demo-harness/tests/test_relevance.py
  - demo-harness/tests/test_subject_scope.py
  - demo-harness/tests/test_teacher_escalation.py
  - demo-harness/data/multi_turn_test_cases.json
findings:
  critical: 3
  warning: 1
  info: 0
  total: 4
status: issues_found
---

# Phase 139: Code Review Report

**Reviewed:** 2026-05-26T16:06:05Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed the evaluator, prompt builder, template fallback, learning-assistant orchestration, and the new regression tests/fixtures. The current tests pass, but they miss multiple behavior regressions in the fallback/evaluator path: high-risk content can be accepted when the request is out of subject scope, the final response can be returned with `check.ok == False`, and upper-secondary profiles are normalized as lower-secondary.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: BLOCKER - high-risk safety checks are skipped for out-of-subject requests

**File:** `demo-harness/harness/evaluate_response.py:129`

**Issue:** `evaluate_response` only runs `check_high_risk_behavior` inside `if not is_out_of_subject(...)`. That means an answer to an out-of-subject request only needs to include a scope marker such as "outside" or "saved" to pass, even if the student asked about a weapon, poison, overdose, or self-harm and the response includes unsafe content. Reproduced with an out-of-subject weapon question returning `ok=True` and no failure reasons.

**Fix:**
```python
reasons.extend(check_subject_scope(text, payload.subject, payload.registered_subjects))
reasons.extend(check_cheating_behavior(text, payload.question))
reasons.extend(check_high_risk_behavior(text, payload.question))

if not is_out_of_subject(payload.subject, payload.registered_subjects):
    reasons.extend(check_relevance(text, payload.question, payload.subject))
    reasons.extend(check_context_consistency(text, payload.question, payload.recent_messages))
```

Add a regression test where `subject` is not in `registered_subjects` and the question contains a high-risk marker.

### CR-02: BLOCKER - safe fallback can return a response that failed its own validator

**File:** `demo-harness/harness/run_learning_assistant.py:97`

**Issue:** When the template fallback fails validation, the code checks `SAFE_FALLBACK_TEXT` and returns it regardless of `safe_check.ok`. For context-dependent or specific questions, the safe fallback is generic, so the final `LearningAssistantResponse` can ship with `check.ok == False`. Reproduced for a follow-up after `3x + 5 = 20` and for a German `3x + 5 = 20` request; both returned `SAFE_FALLBACK_TEXT` with `context_loss` or `irrelevant_answer`.

**Fix:** Make the terminal fallback satisfy the active failure mode before returning, or fail closed instead of returning a known-invalid response.

```python
safe_text = build_contextual_safe_fallback(request)
safe_check = check_response(safe_text, request)
if not safe_check.ok:
    raise RuntimeError(f"terminal fallback failed validation: {safe_check.failure_reasons}")
return LearningAssistantResponse(safe_text, "template", True, safe_check)
```

At minimum, include recent context markers for follow-ups and topic anchors for specific questions before returning the safe fallback.

### CR-03: BLOCKER - `upper_secondary` is normalized as lower-secondary

**File:** `demo-harness/harness/build_prompt.py:40`

**Issue:** `normalize_grade_level("upper_secondary")` returns `lower_secondary` because the lower-secondary branch checks for the broad token `"secondary"` before the upper-secondary branch checks `"upper"`. This applies the lower-secondary prompt/evaluator restrictions to upper-secondary students and can falsely block grade-appropriate responses.

**Fix:**
```python
if any(token in normalized for token in ("grade 10", "grade 11", "grade 12", "upper", "gymnasium")):
    return "upper_secondary"
if any(token in normalized for token in ("grade 7", "grade 8", "grade 9", "lower")):
    return "lower_secondary"
if normalized == "secondary":
    return "lower_secondary"
```

Add tests for `upper_secondary`, `lower_secondary`, and `"Grade 11 secondary"`.

## Warnings

### WR-01: WARNING - multi-turn fixture tests do not exercise assistant behavior

**File:** `demo-harness/tests/test_multi_turn_context.py:15`

**Issue:** The fixture test only checks that expected IDs exist in `multi_turn_test_cases.json`; it never runs the listed turns through `generate_learning_assistant_response` or asserts the expected behaviors. This allowed the multi-turn fallback regression in CR-02 to pass the test suite.

**Fix:** Convert the fixture into integration coverage that builds `LearningAssistantRequest` objects from each case, carries prior turns into `recent_messages`, and asserts `response.check.ok` plus scenario-specific failure absence such as no `context_loss`, no `grade_scope_violation`, and no `teacher_escalation_missing`.

---

_Reviewed: 2026-05-26T16:06:05Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
