# Phase 257 Visual QA: Home V2 Full Page

**Date:** 2026-07-06
**Route:** `/home-v2`
**Evidence:** `/private/tmp/stoa-home-v2-v6-3/257/`

## Screenshot Evidence

Full-page captures:

- `/private/tmp/stoa-home-v2-v6-3/257/en-desktop-1440.png`
- `/private/tmp/stoa-home-v2-v6-3/257/en-tablet-900.png`
- `/private/tmp/stoa-home-v2-v6-3/257/en-mobile-390.png`
- `/private/tmp/stoa-home-v2-v6-3/257/de-desktop-1440.png`
- `/private/tmp/stoa-home-v2-v6-3/257/de-tablet-900.png`
- `/private/tmp/stoa-home-v2-v6-3/257/de-mobile-390.png`

Scroll-position captures:

- `/private/tmp/stoa-home-v2-v6-3/257/sections/desktop-thread.png`
- `/private/tmp/stoa-home-v2-v6-3/257/sections/desktop-parent.png`
- `/private/tmp/stoa-home-v2-v6-3/257/sections/desktop-trust.png`
- `/private/tmp/stoa-home-v2-v6-3/257/sections/mobile-thread.png`
- `/private/tmp/stoa-home-v2-v6-3/257/sections/mobile-parent.png`
- `/private/tmp/stoa-home-v2-v6-3/257/sections/mobile-trust.png`
- `/private/tmp/stoa-home-v2-v6-3/257/sections/mobile-cta.png`

Metrics:

- `/private/tmp/stoa-home-v2-v6-3/257/metrics.json`

## Top Standard

A Swiss middle-to-upper-income parent should be able to scan the mobile page for 30 seconds and perceive a calm, credible, visually refined education product rather than an AI tool page.

**Verdict:** Directionally yes, but not yet final-public ready. Hero/Parent photography and reveal robustness are the biggest readiness gaps.

## Severity-Ranked Findings

### P1 - Reveal Initial State Creates Blank Full-Page Captures

Full-page screenshots show Hero and Footer with the middle of the page blank because below-fold sections remain hidden until IntersectionObserver reveals them. Scroll-position screenshots confirm real scrolling does show the sections, so this is not a normal user-scroll blank-screen bug.

Why it matters:

- Visual regression captures become misleading.
- If reveal JS is delayed, disabled, or fails, important content can remain invisible.
- The page feels less robust than a near-public homepage should.

Phase 259 recommendation:

- Make reveal content readable by default and use a progressive enhancement class/state for entry motion, or add a short deterministic reveal fallback after hydration.
- Keep motion subtle, but avoid an all-or-nothing opacity dependency for below-fold content.

### P1 - Hero And Parent People Photography Are Preview-Safe, Not Final-Public Strong

Hero and Parent images are suitable for prototype evaluation and broadly European-compatible, but they still read as free stock. Parent Confidence in particular has a bright orange interior and a generic laptop-family pose that weakens the high-end Swiss education tone.

Why it matters:

- The current first impression is refined in layout but not fully refined in photographic taste.
- The target audience expects calm confidence, not stock tutoring imagery.

Phase 258 recommendation:

- Run targeted Hero/Parent searches for authentic European/Swiss-compatible family learning moments with softer interiors, natural light, better wardrobe/background restraint, and less staged laptop emphasis.
- Keep paid iStock/commissioned options link-only unless separately approved.

### P2 - Runtime Language Coverage Is EN/DE Only

The repo contains `fr/homeV2.json` and `it/homeV2.json`, but `src/i18n/languages.ts` only exposes `en` and `de`, and `src/i18n/index.ts` only imports EN/DE resources.

Why it matters:

- v6.3 can visually screenshot EN/DE, but FR/IT are only static JSON checks until runtime support changes.
- The v6.3 requirement remains valid, but the execution path must record the current product boundary honestly.

Phase 261 recommendation:

- Either defer FR/IT rendered visual QA explicitly, or add runtime FR/IT support in a separate localization milestone.
- For v6.3, perform static copy-length/tone checks for FR/IT and record the limitation.

### P2 - Desktop Learning Thread Has Strong Editorial Form But Anchor/Sticky Overlap Risk

Scroll-position captures show the sticky floating nav can visually cover the top of the Learning Thread when a section is scrolled into view programmatically. The section itself is visually strong and the 04 alternation now works, but anchor navigation may land too close to the header.

Phase 259 recommendation:

- Add `scroll-margin-top` to Home V2 sections so nav links and QA scrolls land with breathing room.

### P2 - Parent Confidence Message Works, But Image Should Move Toward Quiet Confidence

The copy and proof note are aligned with the user's desired parent value: clearer learning visibility without anxious intervention. The image does not yet match the same level of restraint.

Phase 258 recommendation:

- Prioritize an image that communicates "parent understands progress" through posture, light, and calm context, not through a bright stock laptop scene.

### P3 - Trust Section Is The Strongest Current Visual Direction

The Trust section currently best matches the v6.3 target: non-front-face learning detail, warm material, enough privacy-by-restraint, clear principles, and a strong Apple-like sense of proportion.

Phase 258/259 recommendation:

- Treat Trust as a reference bar for the rest of the page.
- Consider AI-generated non-face detail only if it materially improves light/material quality without looking synthetic.

### P3 - Final CTA Is Strong On Mobile

The final CTA reads cleanly and confidently on mobile. It has good close-out energy without becoming loud. No structural change required in Phase 259 unless surrounding rhythm changes demand small spacing adjustments.

## Locale Notes

Rendered:

- EN and DE render successfully through `stoa_language`.
- DE content increases section heights moderately but does not create visible major crowding in captured section screenshots.

Static only:

- FR and IT `homeV2.json` exist but are not runtime-enabled.
- Longest static strings are in Parent Confidence and Trust bodies, which are likely the highest future fit-risk areas if FR/IT are enabled.

## Acceptance Standard Result

**Current state:** Close, but not final.

The page now feels like a high-end education product more than an AI tool page. The remaining blockers are not IA or copy direction; they are final photographic taste, reveal robustness, and complete locale/runtime evidence.
