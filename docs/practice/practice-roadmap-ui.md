# Practice Roadmap UI

Phase 35 upgrades Practice from a lesson list into a roadmap-style learning path. The goal is progression clarity: students should understand where they are, what is complete, what comes next, and why some lessons are not ready yet.

## Product Principle

Practice Roadmap is a learning path, not a cartoon game map. It can borrow the useful idea of visible progression, but it should keep STOA's calm education tone.

Recommended framing:

> Follow your practice path. Complete short lessons and ask for an explanation when a step is unclear.

## Information Hierarchy

The roadmap must preserve the general Practice hierarchy:

```text
Practice
Subject
Grade level
Topic
Unit
Lesson node
Challenge
```

The current demo uses:

```text
Practice
Mathematics
Lower secondary
Equations
Unit 1: Linear equations
Lesson nodes
Challenges
```

## Visual Direction

- Completed: muted sage or calm green.
- Current: primary STOA emphasis with restrained accent.
- Available: light surface with clear border.
- Locked: muted neutral.
- Review: soft amber or review cue.

Avoid high-saturation game colors, mascots, shops, gems, hearts, leaderboards, and visible reward economies.

## Learning Chat Relationship

Roadmap copy should remind students that Practice is not isolated from Learning Chat. If a lesson step is unclear, students can ask Learning Chat for an explanation with Practice context attached.
