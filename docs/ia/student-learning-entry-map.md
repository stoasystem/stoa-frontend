# Student Learning Entry Map

## Product Relationship

```text
Practice Path
  -> finds where the student gets stuck
Learning Chat
  -> explains the step clearly
Professional teacher support
  -> helps when explanation is not enough
Parent Report
  -> shows the full learning process
```

## Student Entry Points

### Continue Practice

Use when a student wants to start learning without formulating a homework question first.

Expected copy:

> Continue your Practice Path. Pick up where you left off in the available school topic. If a step is unclear, you can ask for an explanation.

### Open Learning Chat

Use when a student already has a specific homework question or needs a clearer explanation.

Expected copy:

> Have a specific homework question? Open Learning Chat for a step-by-step explanation.

## Practice Feedback Flow

1. Student answers a challenge.
2. If the answer is incorrect, show direct feedback.
3. Offer Show hint and Explain this step.
4. Let the student retry.
5. After repeated confusion, offer teacher support.

Teacher support should not appear as the first response to a normal mistake.

## Practice-to-Chat Context

When Practice opens Learning Chat, pass:

- Source: Practice
- Subject
- Grade level
- Topic
- Unit
- Lesson
- Challenge
- Prompt
- Student answer
- Correct answer when available
- Attempts
- Hint viewed
- Return route

The student should never need to retype the practice question.

## Return Path

Learning Chat should show Back to lesson whenever `returnTo` exists in the Practice context.

## Parent Visibility

Parent Report should convert the flow into one learning story:

> Your child practised the current Mathematics / Equations demo topic and asked for explanations when a step was unclear. This helps show where understanding is already strong and where more practice may help.

The parent-facing model should stay subject-agnostic. Equations can appear as the current demo topic, but the reporting structure should support future topics such as functions, geometry, physics, chemistry, biology, and other middle-school or high-school knowledge areas.
