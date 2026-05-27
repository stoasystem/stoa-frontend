# Practice Demo Data

Practice demo data lives in `src/data/mockPractice.ts` and supports deterministic frontend walkthroughs without a backend.

## Subjects

- Mathematics

## Mathematics Path

Phase 28 fixes the visible demo package to Mathematics / lower secondary / equations.

This is seed content for the current demo. It is not a statement that Practice Path only supports equations.

Unit 1: Linear equations in one variable

- One-step equations
- Two-step equations
- Equations with brackets
- Word problems with linear equations

Unit 2: Quadratic equations

- Recognizing quadratic equations
- Factoring simple quadratics
- Solving factored quadratics
- Checking two solutions

Unit 3: Linear systems in two variables

- What is a system of equations?
- Solving by substitution
- Solving by elimination
- Checking the solution

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

Physics and other Mathematics topics are future expansion examples outside the current demo package. The data model and UI should remain subject-agnostic and topic-agnostic.
