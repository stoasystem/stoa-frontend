# Phase 197 Plan

## Goal

New Learning Assistant responses use the saved student answer-language preference across prompt, provider request, and fallback paths.

## Tasks

1. Wire chat backend.
   - Read `preferred_language` from the student profile.
   - Normalize it before calling `LearningAssistantRequest`.
   - Remove the hard-coded English language.

2. Expand template fallback language handling.
   - Add language-specific texts for generic, out-of-scope, direct-answer safety, confusion/teacher support, equation, quadratic, and speed branches.
   - Keep responses guided and non-final-answer-first.

3. Extend response evaluator markers.
   - Add non-English step/scope/teacher/cheating markers needed for fallback regression tests.

## Verification

- Python harness tests in Phase 198.
- Backend smoke checks in Phase 198.

