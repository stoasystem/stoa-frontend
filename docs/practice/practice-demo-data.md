# Practice Demo Data

Practice demo data lives in `src/data/mockPractice.ts` and supports deterministic frontend walkthroughs without a backend.

## Subjects

- Mathematics
- Physics

## Mathematics Path

Unit 1: Linear equations

- Solving one-step equations
- Solving two-step equations
- Word problems with equations

Unit 2: Quadratic basics

- Factoring simple expressions
- Solving simple quadratic equations

## Physics Path

Unit 1: Motion

- Speed, distance, and time
- Units and conversion
- Simple graph interpretation

## Challenge Types

Each lesson uses a small set of demo challenges:

- Multiple choice
- Text input
- Ordering
- Short explanation

Answer checking is intentionally simple and deterministic. It exists to support UI interaction testing, feedback states, hint flow, result summaries, dashboard cards, and parent report previews.

## Demo Boundaries

The data is not a curriculum database. It does not attempt adaptive sequencing, production progress persistence, teacher assignment logic, or high-stakes grading.

Practice should show students what to do next, give calm feedback, and offer hint-first support when they miss a step.
