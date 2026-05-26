# Duolingo Clone Reference Audit

**Source repo:** https://github.com/sanidhyy/duolingo-clone

## What We Learned

The reference project is useful as a compact model for a path-based learning loop:

- A learner chooses a course-like entry point.
- The course is broken into ordered units.
- Units contain lesson nodes with locked, active, and completed states.
- A lesson presents one challenge at a time.
- Challenge feedback is immediate.
- The learner can retry, continue, and reach a result screen.
- Lightweight progress signals make the next action obvious.

For STOA, these mechanics are useful because they turn learning from only "ask when stuck" into "continue a short, guided practice path."

## What STOA Will Adapt

- Subject paths instead of language courses.
- Units and lesson nodes for Mathematics and Physics.
- Simple challenge flow with progress, answer checking, feedback, retry, and lesson completion.
- Progress points, daily goal, study streak, attempts, and mistakes review as calm learning signals.
- Hint-first support when a student answers incorrectly.
- A result page that shows what was practiced and what to review next.

## What STOA Will Not Copy

- The codebase structure.
- The Next.js backend/server-action architecture.
- Clerk, Stripe, Neon, Drizzle, Bun, React Admin, or database schema choices.
- Language-learning content model, flags, audio, or speaking/listening assets.
- Shop, gems, punitive hearts/lives, leaderboards, or monetized failure loops.
- Mascot-heavy visuals, cartoon reward screens, or loud celebration effects.

## STOA-Specific Interpretation

Duolingo-style lesson becomes STOA Practice Lesson.

Language path becomes Subject learning path.

Hearts become Attempts.

XP becomes Progress points.

Quests become Daily learning goals.

Streak becomes Study streak.

Shop is not introduced.

The resulting product should feel like a premium school-support practice workspace, not a game clone.
