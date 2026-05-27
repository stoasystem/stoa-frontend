# Research: UI/Interaction Stack for Phase 33 Practice Homepage Entry

**Milestone:** Phase 33: Homepage Practice Game / Practice Path entry refinement  
**Research dimension:** UI/interaction patterns  
**Date:** 2026-05-27  
**Overall confidence:** HIGH for implementation direction, MEDIUM for motivation-pattern transfer from language-learning products to STOA subject learning

## Recommendation

Do not add a new UI, animation, game, sound, state-machine, or gamification dependency. Build the clearer and more fun Practice homepage entry with the existing React, TypeScript, Vite, React Router, i18next, Tailwind-style utility classes, lucide-react icons, STOA theme tokens, and current Practice Path routes.

The implementation should be a premium education interaction module, not a game module. Treat "fun" as approachable momentum: short visible steps, a preview of progress, gentle feedback, and a clear path into Learning Chat, Professional Teacher Support, and Parent Report. Avoid mechanics that make STOA look like a game-first product: XP, coins, hearts/lives, streak pressure, leaderboards, avatars/mascots, shops, public "play" wording, confetti-heavy success, or competitive ranking.

## Current Stack Fit

| Area | Use Existing | Phase 33 Direction |
|------|--------------|--------------------|
| Component structure | `HomePracticeEntry`, `HomePracticeToChatFlow`, `HomeLearningJourney` | Refactor the homepage Practice module into a clearer editorial intro plus a richer Practice preview card. |
| Routing | React Router links to `/login?next=/practice`, `/practice`, `/chat` | Keep primary CTA pointed at learning start/continue, not game start. Use secondary CTA for explanation of how Practice connects to Chat/support/reporting. |
| Copy | `src/i18n/locales/{en,de,fr,it}/home.json` | Add short, reusable labels for preview card states, path steps, and support handoff. Validate German/French/Italian button fit. |
| Visual system | `platform-theme.css`, `premium-theme.css`, STOA burgundy/warm paper/charcoal tokens | Use restrained color accents, small progress marks, icons, and card depth. Do not introduce bright arcade colors or mascot-like illustrations. |
| Icons | `lucide-react` | Use existing education/support icons: `Route`, `BookOpenCheck`, `Lightbulb`, `MessageCircle`, `GraduationCap`, `PanelsTopLeft`, `CheckCircle2`. |
| Motion | Existing CSS transitions and `prefers-reduced-motion` pattern | Add only subtle hover/step reveal/checkmark transitions. Gate spatial movement with reduced-motion CSS. |

## Interaction Pattern to Build

### Homepage Practice Preview Card

Build a single concrete preview card that shows Practice as the first step in the full STOA learning loop.

Recommended card anatomy:

1. **Path header:** subject chip, "Practice Path", estimated time, lesson count, current step.
2. **Mini path:** 3-4 calm nodes, for example `Warm-up`, `Try a step`, `Explain`, `Teacher support`. The final node should point beyond Practice, not end in a reward.
3. **Active practice preview:** one equation-style prompt or lesson title with a compact progress indicator such as `2 of 5 steps`.
4. **Gentle feedback line:** "A hint appears before the full explanation" / "If this step is unclear, Learning Chat opens with the work attached."
5. **Connected outcomes row:** Learning Chat, Teacher Support, Parent Report. This prevents Practice from visually becoming the whole product.
6. **CTA pair:** one primary filled CTA and one secondary outlined/text CTA.

Primary CTA hierarchy:

- Primary: `Start learning`, `Continue practice`, or locale-specific equivalent. Link to `/login?next=/practice` on public homepage.
- Secondary: `See how practice works` or `How support connects`. Link to `/how-it-works` or the relevant homepage learning-flow anchor.
- Avoid: `Play now`, `Start game`, `AI game`, `Duolingo-style`, `Earn XP`, `Keep your streak`.

Material guidance supports using the filled/high-emphasis button only for the most important action, with outlined/text buttons for lower-priority actions. STOA should keep exactly one visually dominant CTA in the Practice module.

### Motivation Model

Use:

- **Bite-sized progress:** show a small number of steps and estimated effort.
- **Competence feedback:** show what the student can try next, not whether they are "winning".
- **Autonomy:** offer "Start with Practice" and "Ask a question" as related paths, not competing products.
- **Relatedness/support:** make teacher support and parent visibility visible as calm reassurance.
- **Immediate next action:** the card should answer "What happens if I get stuck?"

Avoid:

- **Loss-framed retention:** streak loss, daily pressure, countdowns, "do not break your progress".
- **Competitive status:** leaderboards, ranks, public scores, peer comparison.
- **Economy mechanics:** gems, hearts/lives, unlock currency, shops.
- **Over-celebration:** large confetti, bouncing animations, novelty reward screens.

Rationale: Duolingo's own method emphasizes bite-sized lessons, immediate feedback, progress paths, streaks, points, rewards, and competition. For STOA, the transferable parts are short effort, feedback, and progress clarity. The non-transferable parts are brand-specific reward loops and game economy mechanics, especially because STOA must remain a premium education platform connected to human teacher support and family reporting.

## Component-Level Implementation Notes

Recommended component split:

| Component | Responsibility |
|-----------|----------------|
| `HomePracticeEntry` | Section layout, headline, body, CTA hierarchy. |
| `HomePracticePreviewCard` | Rich concrete preview of the Practice Path entry. |
| `PracticeMiniPath` | Static homepage mini path with 3-4 nodes and accessible labels. |
| `PracticeConnectedOutcomes` | Three small outcome chips/cards for Learning Chat, Teacher Support, Parent Report. |

Keep these components presentational. Do not add server state, timers, real lesson mutation, sound, or persisted gamification state. Static preview data should live in i18n copy or a small typed constant if repeated across locales.

Suggested TypeScript shape if a local constant is cleaner than raw JSX:

```ts
type PracticePreviewStep = {
  key: 'warmup' | 'tryStep' | 'explain' | 'support'
  icon: LucideIcon
  tone: 'neutral' | 'active' | 'complete'
}
```

Use semantic HTML:

- `section` with a localized accessible heading.
- `ol` for ordered mini-path steps.
- Real `Link`/`Button asChild` for CTAs.
- `aria-current="step"` for the active mini-path node if implemented.
- Text labels must carry the meaning; icons are decorative unless the icon is the only visible label.

## Visual Direction

Use STOA's current premium platform language:

- Warm card surface on the public homepage section.
- Burgundy primary action and active path node.
- Charcoal text, muted borders, restrained gold/warm highlight only as an accent.
- Small check/route marks for progress.
- 8px or existing rounded-lg radius; no pill-heavy arcade UI.
- No copied Duolingo green, owl/mascot cues, cartoon scene language, speech-bubble overload, or game-map zigzag path.

The preview can feel more lively through layering and clear state, not through a new visual brand. A good target is "a polished guided-learning card a parent trusts and a student can immediately understand."

## Motion and Accessibility

Motion should be optional and minimal:

- Allow hover lift/outline changes on the preview card and active node.
- Allow a subtle checkmark opacity/scale change only if it respects `prefers-reduced-motion`.
- Avoid continuous animations, parallax, bouncing paths, shaking incorrect states, and celebration loops.
- Validate keyboard focus order: intro copy -> primary CTA -> secondary CTA -> preview card interactive elements only if they are real links/buttons.

W3C WCAG guidance says non-essential motion triggered by interaction should be disableable and highlights `prefers-reduced-motion` as a sufficient technique. Treat this as mandatory for any Phase 33 motion.

## Four-Language Copy Guidance

Keep public copy education-first and short enough for German:

| Concept | English direction | Notes |
|---------|-------------------|-------|
| Eyebrow | `Practice as a learning entry` | Existing wording is safe. |
| Title | `Start with practice. Continue with clear explanations.` | Keep Practice subordinate to explanation/support. |
| Primary CTA | `Start learning` / `Continue practice` | Prefer learning language over game language. |
| Secondary CTA | `See how practice works` | Explains, does not compete with primary. |
| Preview status | `2 of 5 steps` | Numeric progress without points/score. |
| Handoff | `Open in Learning Chat` / `Explain this step` | Existing product language is safe. |
| Parent value | `Parents see the full learning activity` | Avoid surveillance/ranking tone. |

Forbidden public phrases for this phase:

- `Duolingo-style`
- `AI game`
- `play now`
- `gamified AI platform`
- `earn XP`
- `keep your streak`
- `leaderboard`
- `lives` / `hearts` as failure mechanics

## QA Checklist for Implementation

- Homepage section communicates Practice -> Learning Chat -> Teacher Support -> Parent Report in one glance.
- Practice preview card has one dominant CTA and does not visually overpower the platform hero.
- No public copy uses game-first, AI-provider, demo/mock, or Duolingo-reference wording.
- All four locales fit at mobile widths without button/card overflow.
- Reduced-motion mode removes spatial flourish.
- Keyboard tab order is predictable.
- `/login?next=/practice` remains the public primary entry target unless product direction changes.
- Practice is still not added as a top-level public navbar item.

## Sources

- Duolingo Method whitepaper, for reference mechanics only: bite-sized lessons, immediate feedback, progress path, streaks, points, rewards, and competition are part of its app-based method. STOA should borrow short effort/progress/feedback, not reward economy or brand style. https://duolingo-papers.s3.amazonaws.com/reports/duolingo-method-whitepaper.pdf
- Duolingo Blog on streak design, for boundary setting: streaks can motivate habit formation but also rely on loss-aversion dynamics that are too pressure-oriented for STOA's calm homepage entry. https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Material Web buttons, for CTA hierarchy: filled buttons are high-emphasis, outlined/text buttons are lower emphasis, and button labels should describe the action. https://material-web.dev/components/button/
- W3C WCAG Understanding SC 2.3.3, for interaction motion: support reduced-motion preferences and avoid unnecessary motion. https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- Negative Effects of Gamification in Education Software, for anti-feature caution: badges, leaderboards, competitions, and points are frequently associated with reported negative effects in learning systems. https://arxiv.org/abs/2305.08346
- Advancing Gamification Research and Practice with Self-Determination Theory, for motivation framing: autonomy, competence, and relatedness support deeper engagement than purely reward-based mechanics. https://link.springer.com/article/10.1007/s11528-024-00968-9
