# Research: Feature Patterns for Phase 29

**Milestone:** v1.27 Phase 29
**Date:** 2026-05-26

## Question

Which Practice interaction features are table-stakes, and which should STOA avoid or defer?

## Table Stakes

### Practice Interaction

- A lesson start screen should set expectations before the first challenge: title, what will be practiced, estimated time, number of checks, and start action.
- Challenge screens should have stable structure: progress, prompt, answer control, attempts indicator, and one primary action.
- Correct feedback should be immediate, specific, and short.
- Incorrect feedback should be supportive, preserve the retry path, and avoid revealing the final answer too early.
- Hint display should be stable and close to the feedback area.
- Lesson completion should summarize result, topics practiced, mistakes to review, and next actions.

### Practice to Learning Chat

- `Explain this step` should appear as a secondary action when a student is stuck.
- Chat should open with the current practice context visible.
- Chat should provide a clear `Back to lesson` action.
- The context card should explain that the student is reviewing a practice step, not starting a disconnected chat.

### Practice to Teacher Support

- Teacher support should be delayed until repeated confusion, repeated wrong answers, or explicit stuck intent.
- Teacher support should carry topic, lesson, challenge, answer, and attempt context.
- Copy should ask whether a teacher should explain the step, not imply failure.

### Site Layout

- Student Dashboard should become the learning entry center.
- Practice and Chat should be framed as two learning modes:
  - Practice a topic.
  - Ask a question.
- Parent reporting should combine questions, practice lessons, mistakes reviewed, teacher support, and next recommendation under learning activity.

## Differentiators for STOA

- Premium, restrained educational styling instead of cartoon reward styling.
- Contextual Learning Assistant escalation, not generic "AI help".
- Parent-readable learning activity framing that does not create anxiety.
- Stable demo flow that can be explained in 3-5 minutes.

## Anti-Features

- Hearts as punitive blockers.
- Shop, gems, leaderboards, loud celebratory animations, or mascot-driven reward loops.
- Direct answer reveal on the first wrong attempt.
- Practice and Chat as visually unrelated product islands.
- Production backend, real adaptive learning, or large curriculum expansion during this milestone.

## Sources

- Duolingo clone reference repo and lesson mechanics: https://github.com/sanidhyy/duolingo-clone
- Gamification misuse research: https://arxiv.org/abs/2203.16175
- Multiple-try feedback and hints research: https://link.springer.com/article/10.1007/s11423-022-10105-z
- Duolingo gamification case study used as market/UX context, not implementation authority: https://trophy.so/blog/duolingo-gamification-case-study

