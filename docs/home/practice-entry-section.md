# Homepage Practice Entry Section

## Purpose

The homepage Practice entry makes the existing Practice Path visible as a low-friction way for students to start learning. It turns Practice from explanatory copy into a direct learning entry while keeping STOA positioned as a complete learning support platform.

## Placement

The section belongs directly after the Hero and before the broader How STOA Works flow.

This order matters:

1. Hero explains STOA's main value: clear learning support, teacher escalation, and parent visibility.
2. Practice entry gives students a concrete first action.
3. How STOA Works explains the complete platform.

## Product Hierarchy

Practice is an entry, not the product identity.

Flow:

1. Practice Game / Practice Path helps the student start.
2. Hints appear when the student makes a mistake.
3. Learning Chat explains unclear steps.
4. Professional Teacher Support helps when guided explanation is not enough.
5. Parent Report shows the complete learning process.

## UI Requirements

- The entry should look clickable and more concrete than a plain text section.
- The card should stay visually below the Hero CTA hierarchy.
- The main entry should describe Practice Path as short challenges for school topics.
- The preview may show the current demo topic: Mathematics / Equations with one-step equations, quadratic basics, and linear systems.
- The design should use the existing premium STOA theme.
- Do not use bright game-first styling, mascot cues, XP, streaks, hearts, gems, shops, or leaderboards.

## Current Implementation

- Section: `src/components/home/HomePracticeEntry.tsx`
- Entry card: `src/components/home/PracticeEntryCard.tsx`
- Preview: `src/components/home/HomePracticePreview.tsx`
- Routing helper: `src/lib/navigation.ts`

## Scope Principle

Practice Path is general. Equations are the first demo package.

Do not write homepage copy that implies STOA Practice Path equals equations. Use equation language only in demo preview labels or current available content labels.
