# Project Research: Features for v2.1 Question Bank UI Design

**Milestone:** v2.1 Question Bank UI Design
**Date:** 2026-06-01

## Feature Categories

### Discovery and Browsing

**Table stakes**

- Student can open a Question Bank home page from authenticated student navigation.
- Student can search for subjects, topics, skills, question sets, and individual question prompts in local mock data.
- Student can browse subject cards and topic cards with set counts, question counts, and progress.
- Student can see recommended question sets, continue practice, mistakes review, and recent practice on the home page.

**Differentiators**

- Question Bank copy explicitly distinguishes open practice from guided Practice Path.
- Cards use learning-relevant metadata instead of generic content-library metadata: level, difficulty, question types, estimated time, skills, status, and weak areas.

### Filtering and Question Set Selection

**Table stakes**

- Subject pages filter by grade/level and difficulty.
- Topic pages filter by difficulty, question type, and status.
- Active filter state remains visible and can be reset.
- Question set cards show status-specific actions: Start, Resume, Practice Again, or Review.

**Differentiators**

- Filter design stays compact and scannable, with desktop sidebar/topbar and mobile collapsed controls where appropriate.
- Weak-area panel helps students choose what to practice without requiring adaptive algorithms.

### Question Set Overview

**Table stakes**

- Student sees title, description, number of questions, difficulty range, estimated time, subject/level, skills covered, question-type breakdown, and last-attempt summary.
- Student can start, resume, start again, or review mistakes depending on mock state.
- The overview page prevents a question set from feeling like a bare list of questions.

**Differentiators**

- Help note tells students they can ask the Learning Assistant after a question, without turning the whole set into Chat.

### Session and Feedback

**Table stakes**

- Student can answer multiple-choice, short-answer, numeric-answer, and step-by-step UI question types.
- Session page shows set title, question number, progress, question prompt, answer input, check/skip action, feedback, and previous/next navigation.
- Feedback states include idle, checking, correct, incorrect, partially correct, and skipped.
- Last question supports Finish Set and review-unanswered behavior.

**Differentiators**

- Low-pressure learning tone rather than exam tone.
- Incorrect feedback shows the student's answer, correct answer, a short explanation, and a Learning Assistant CTA.

### Results and Mistakes Review

**Table stakes**

- Result page shows score, time spent, accuracy by topic, incorrect/skipped questions, recommended next steps, Retry Mistakes, and Continue to Practice Path.
- Mistakes page shows summary, subject/topic/difficulty filters, mistake list, and Start Review Session.
- Mistake review can reuse the question-session shell with a review-mode context.

**Differentiators**

- Results connect Question Bank to Practice Path and Learning Chat as next steps instead of presenting score as the only outcome.

### Parent and Tutor Comprehension

**Table stakes**

- Parent-facing learning activity includes enough Question Bank language to understand practice attempts, mistakes reviewed, and next focus.
- Tutor request context can identify a question-bank source when a student asks for help from a question.
- Docs explain the Question Bank / Practice Path / Learning Chat relationship.

**Differentiators**

- Parent/tutor surfaces frame Question Bank as evidence of active practice, not a separate product silo.

## Anti-Features

- Do not add production item authoring or admin management.
- Do not add AI-generated questions.
- Do not add image upload or recognition.
- Do not add video help or live teacher joining.
- Do not add complex timed exam mode.
- Do not add paid question-bank locks.
- Do not add formal school-standard mapping.
- Do not use visible mock/demo/provider wording in the product UI.
