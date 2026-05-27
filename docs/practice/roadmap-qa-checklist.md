# Practice Roadmap QA Checklist

## Roadmap Flow

- [ ] `/practice` loads the roadmap.
- [ ] `/practice/mathematics/equations` loads the topic roadmap.
- [ ] Completed node is clickable.
- [ ] Current node is highlighted.
- [ ] Available node is clickable.
- [ ] Locked node does not start a lesson.
- [ ] Locked node shows unlock hint.
- [ ] Continue card opens the current lesson.
- [ ] Lesson completion updates mock roadmap state.

## Visual QA

- [ ] Desktop roadmap has a clear path feeling.
- [ ] Mobile roadmap is readable.
- [ ] Node spacing is stable.
- [ ] Connector lines align with nodes.
- [ ] Long German lesson titles do not break layout.
- [ ] French apostrophes render correctly.
- [ ] Italian CTA labels do not overflow.

## Scope QA

- [ ] Roadmap is subject-agnostic.
- [ ] Equation wording appears only as current demo content.
- [ ] No shop, gems, mascot, hearts, leaderboard, or XP language appears.
- [ ] Learning Chat is presented as explanation support.

## Verification

- [ ] `npm run build` passes.
- [ ] Browser checks cover desktop and mobile.
