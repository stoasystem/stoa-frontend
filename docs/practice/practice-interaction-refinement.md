# Practice Interaction Refinement

Phase 29 keeps the equation Practice Path content from Phase 28 and refines the interaction loop.

## Design Principles

- Short lessons should start with a clear intro before the first question.
- The challenge screen should keep progress, prompt, answer control, feedback, hint, and actions in stable places.
- Correct feedback should name the useful reasoning step.
- Incorrect feedback should stay supportive and point to the next operation without revealing the final answer first.
- `Explain this step` is a secondary route into Learning Chat.
- `Ask a teacher` is tertiary and appears after repeated confusion.

## Lesson Flow

1. Lesson intro: title, practice goal, estimated time, number of checks, start action.
2. Challenge: prompt, answer control, check action, attempts indicator.
3. Feedback: correct or not-quite state.
4. Hint: stable next-step panel.
5. Retry or Learning Chat.
6. Completion summary.
7. Mistake review.

## STOA Adaptation

The Duolingo-style mechanism we adapt is the smooth challenge loop: progress, answer, immediate feedback, retry, next action. We do not adapt cartoon styling, punitive hearts, shop/gems, leaderboards, or loud celebration behavior.
