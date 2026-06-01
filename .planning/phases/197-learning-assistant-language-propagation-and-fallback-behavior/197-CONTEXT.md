# Phase 197: Learning Assistant Language Propagation and Fallback Behavior - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

New Learning Assistant responses use the saved student answer-language preference across the prompt, provider request, and template fallback paths.
</domain>

<decisions>
## Implementation Decisions

### Source of truth

Use the saved `student_profiles.preferred_language` value when sending chat messages. Default to English only when no supported value is stored.

### Fallback behavior

Template fallback should produce guided, non-answer-first messages in the requested language for generic, out-of-scope, direct-answer, repeated-confusion, equation, quadratic, and physics-style branches.
</decisions>

<code_context>
## Existing Code Insights

- `backend/app/main.py` currently hard-codes `language="en"` in the Learning Assistant request.
- `demo-harness/harness/build_prompt.py` already includes the response language in the prompt.
- `demo-harness/harness/providers/template_provider.py` already has partial multilingual fallback support.
- `demo-harness/harness/evaluate_response.py` needs marker coverage for non-English fallback safety checks.
</code_context>

<specifics>
## Specific Ideas

- Pass `normalize_response_language(profile["preferred_language"])` into `LearningAssistantRequest`.
- Centralize fallback text by branch and language to keep behavior stable.
- Keep provider/debug/internal terminology hidden.
</specifics>

<deferred>
## Deferred Ideas

- Provider-specific language detection.
- Translating old conversation history.
</deferred>

