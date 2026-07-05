---
status: resolved
trigger: "Home V2 Learning Thread shows a large blank area after the section heading in the browser screenshot."
created: 2026-07-05
updated: 2026-07-05
---

# Debug Session: Home V2 Learning Thread Blank

## Symptoms

- Expected behavior: Learning Thread cards should be visible shortly after the section heading, with the line and cards progressing together.
- Actual behavior: A large blank area appears after the heading; the vertical line is visible but the cards are missing or appear much later.
- Error messages: None visible in the browser.
- Timeline: Started after adding the Learning Thread scroll/active animation.
- Reproduction: Open `/home-v2`, scroll to the Learning Thread section, especially at wide/mobile-like browser sizes.

## Current Focus

- hypothesis: `HomeV2Reveal` uses imperative `classList.add('is-visible')`, and dynamic Learning Thread active/completed class updates cause React to overwrite that class.
- test: Measure `.home-v2-thread-item` class lists and computed opacity after scrolling into the Learning Thread.
- expecting: Items in view have `opacity: 0` and lack `is-visible` despite visible bounding boxes.
- next_action: Move reveal visibility into React state so `is-visible` survives re-renders.

## Evidence

- timestamp: 2026-07-05T12:12:00+02:00
  observation: Playwright reproduced the blank area. Thread items 0-2 were fully within the viewport but had `opacity: 0`, `transform: translateY(64px)`, and no `is-visible` class after active/completed state updates.

## Eliminated

- hypothesis: Cards are not laid out in the viewport.
  reason: Bounding boxes showed cards in the viewport; they were invisible due to reveal opacity.

## Resolution

- root_cause: `HomeV2Reveal` stored visibility by imperatively adding `is-visible` to the DOM node. Learning Thread cards also receive dynamic React class updates for `is-active` / `is-complete`, so React re-rendered those nodes and replaced the manually added `is-visible` class. Cards stayed mounted and laid out but returned to `opacity: 0`.
- fix: Store reveal visibility in React state and render `is-visible` through the component's `className` expression.
- verification: Reproduced the blank state before the fix, confirmed all visible thread items retain `is-visible` and `opacity: 1` after the fix, then ran lint, build, and Home V2 E2E.
- files_changed: `src/components/home-v2/HomeV2Reveal.tsx`
