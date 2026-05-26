# Repair Prompt Rules

## Allowed Repair Triggers

- Direct answer appears first.
- Internal implementation terms appear.
- Explanation is too advanced for the grade band.
- Answer is irrelevant or generic.
- Answer is too long.
- Multi-turn context is lost.
- Cheating or copy request is not redirected.

## Repair Constraints

The repaired answer must:

- Stay in the requested response language.
- Address the student's current question.
- Use short guided steps.
- Avoid final-answer-first openings.
- Use grade-appropriate concepts only.
- Respect registered subject scope.
- Mention professional teacher support when confusion or scope requires it.
- Avoid the words Codex, AI, model, prompt, demo, backend, mock, provider, and system instruction.

## Forbidden Fixes

- Do not hard-code complete answers for one regression question.
- Do not rewrite assistant output in the frontend.
- Do not expose provider errors or debug details to the student.
- Do not make every answer an identical template just to pass tests.

## Example Repair Instruction

```text
Rewrite the response for the student's grade level. Keep the same question and context. Do not start with the final answer. Guide the student step by step. Use only grade-appropriate concepts. Keep it concise, relevant, and free of internal implementation terms.
```

