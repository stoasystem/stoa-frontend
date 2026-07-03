# Home V2 Redesign Milestone Plan

## Purpose

This document plans a separate STOA homepage redesign without replacing the current production homepage. The new version should be developed as an isolated route and component set until it passes visual, copy, localization, animation, and product-readiness review.

The redesign responds to the current homepage audit:

- The current homepage explains too many product functions with similar visual weight.
- The primary public audience should be Swiss parents, but the current content often speaks as if the primary audience is the student or product evaluator.
- Practice, teacher support, parent visibility, and trust are presented as separate feature modules rather than one coherent family decision story.
- The current visual system is calm and branded, but still reads too much like a templated product landing page.
- Motion exists only as light reveal/hover polish and does not yet carry the core story.

## Agreed Direction

### Audience

Primary audience for the public homepage:

- Swiss parents evaluating support for their child's homework and learning routine.

Secondary audiences:

- Students, tutors, schools, and administrators remain supported through navigation and role-specific pages, but they are not the homepage's first narrative target.

### Positioning

STOA should not present itself as an AI homework tool. It should present itself as:

```text
A calm, teacher-backed intelligent learning support system for Swiss families.
```

### Tone

The target mix is:

- 70% Swiss private-school / high-end education service.
- 30% modern learning product.

This means:

- Trust, restraint, family confidence, and educational credibility come first.
- Product UI appears as evidence, not as the main spectacle.
- AI is not a hero-level concept.
- Teacher support and parent visibility are part of one coherent learning thread.

### Core Promise

When homework gets stuck, STOA keeps learning moving: students receive a clear next step, teacher support can connect when needed, and parents see the learning pattern without taking over the work.

## Non-Negotiables

- Preserve the existing homepage at `/` until an explicit switch decision is made.
- Build the new version separately, likely at `/home-v2`.
- Keep current role-specific app pages separate from the public homepage redesign.
- Avoid a generic SaaS landing page layout.
- Avoid feature-card overload.
- Avoid hero-level AI language.
- Avoid copying the external company website's code, CSS, components, or assets.
- Keep multilingual layout stability in English, German, French, and Italian.
- Do not claim production capabilities that are not implemented or verified.

## Proposed New Homepage Structure

The target homepage should be shorter and more cinematic than the current page:

1. Hero: a Swiss family homework moment, with a concise parent-facing promise and `Start learning` CTA.
2. Learning Thread: a scroll-animated story showing question, clear next step, teacher join, and parent pattern.
3. Parent Confidence: what parents gain without taking over homework.
4. Swiss Trust Layer: local learning rhythm, multilingual family context, teacher-backed support, privacy-conscious product behavior.
5. Final CTA: restrained, confident invitation to start learning.

The exact section count can change during design, but the narrative should remain parent-first and thread-based.

## Milestone 1: Positioning And Information Architecture

### Objective

Convert the redesign direction into a precise homepage narrative and route plan before visual production begins.

### Key Decisions

- Keep current `/` homepage unchanged.
- Create new public route candidate: `/home-v2`.
- New page component candidate: `src/pages/home-v2/HomeV2Page.tsx`.
- New component namespace candidate: `src/components/home-v2/`.
- New translation namespace candidate: `homeV2`.
- New homepage story target: Swiss parents, not generic students or SaaS buyers.

### Scope

- Audit current homepage sections and classify each as:
  - Keep.
  - Merge.
  - Demote.
  - Delete.
  - Rewrite.
- Define final section order.
- Define primary and secondary CTAs.
- Define what the homepage must not say.

### Deliverables

- Information architecture document or section map.
- Page route and component namespace proposal.
- Content inventory mapping old homepage sections to new sections.
- Initial user journey from homepage CTA to registration/login flow.

### Acceptance Criteria

- Existing homepage remains available at `/`.
- New route name and namespace are agreed.
- Each current homepage section has an explicit disposition.
- The page has one primary audience and one primary action.
- No section exists only because the old homepage had it.

### Dependencies

- Current homepage implementation.
- Current routing setup in `src/app/router/AppRouter.tsx`.
- Existing auth/login redirect behavior.

### Risks

- Trying to satisfy parents, students, teachers, and schools equally on one page.
- Keeping too many legacy sections and only restyling them.
- Making CTA language too trial/demo-oriented.

## Milestone 2: Visual Direction And Design System Extension

### Objective

Define the visual system for the new homepage without disrupting app surfaces.

### Design Direction

Target tone:

```text
Swiss private-school editorial with a restrained modern product layer.
```

### Scope

- Define Home V2 typography use:
  - Display headings.
  - Body copy.
  - Navigation.
  - CTA labels.
  - Learning-thread UI labels.
- Define Home V2 color behavior:
  - Warm paper surfaces.
  - Burgundy as confident action.
  - Charcoal as institutional depth.
  - Muted sage/gold only as secondary atmosphere or semantic accent.
- Define section spacing and grid rhythm.
- Define crafted panel style for public marketing surfaces.
- Define CTA treatment with a premium trailing-arrow pattern.

### Deliverables

- Home V2 visual rules.
- Token usage map showing which existing tokens are reused.
- Any new CSS helper class names required for Home V2.
- Static wireframe or text-based layout blueprint.

### Acceptance Criteria

- The design reads as high-end education service, not generic SaaS.
- It remains compatible with existing STOA brand tokens.
- It does not introduce visual rules that would conflict with app pages.
- It avoids generic 3-column feature grids as the dominant composition.
- It defines clear mobile collapse rules.

### Dependencies

- `src/styles/brand-tokens.css`.
- `src/styles/platform-theme.css`.
- `src/styles/design-notes.md`.
- Existing homepage imagery and available new assets.

### Risks

- Over-designing a luxury look that feels unrelated to a functional learning platform.
- Introducing too much decoration and hurting credibility.
- Applying public homepage typography to dense app surfaces by accident.

## Milestone 3: Image And Asset Strategy

### Objective

Choose or create the visual assets that can carry the Swiss family homework story.

### Current Asset Candidates

Existing local assets:

- `img/family-learning.jpeg`
- `img/parent-homework.jpeg`
- `img/student-laptop-study.jpeg`
- `img/teacher-student-support.jpeg`
- `img/study-materials.jpeg`
- `img/library-study-table.jpeg`
- `img/login-study.jpeg`
- `img/teacher-classroom.jpeg`

Likely current best candidates:

- Hero: `parent-homework.jpeg` or `family-learning.jpeg`
- Learning thread support: `student-laptop-study.jpeg`
- Teacher support: `teacher-student-support.jpeg`
- Trust/atmosphere: `study-materials.jpeg`

### Scope

- Review image quality, crop safety, subject matter, and Swiss-family fit.
- Decide whether existing assets are acceptable for Home V2 or whether new imagery is needed.
- Define crop ratios for desktop, tablet, and mobile.
- Define overlay treatment and color grading.
- Define alt text guidelines.

### Deliverables

- Image asset matrix.
- Hero image decision.
- Section image assignment.
- Crop and overlay specifications.
- List of missing assets, if any.

### Acceptance Criteria

- Hero visual immediately signals family homework context.
- Images do not look like generic stock SaaS imagery.
- Mobile crops preserve faces, hands, books, and learning context.
- Every meaningful image has appropriate alt text.
- Image treatment matches warm editorial STOA tone.

### Dependencies

- Existing `img/` directory.
- Any approved image generation or photo sourcing workflow.
- Public brand tone and privacy boundaries.

### Risks

- Existing imagery may not feel Swiss enough.
- Over-dark overlays may make the site feel heavy.
- Too many different photo moods can make the page feel patched together.

## Milestone 4: Route, Component, And Translation Scaffold

### Objective

Create the separate technical foundation for Home V2 without changing the current homepage.

### Scope

- Add a new route, likely `/home-v2`.
- Add `HomeV2Page`.
- Add `src/components/home-v2/`.
- Add `src/i18n/locales/en/homeV2.json` first.
- Register `homeV2` namespace.
- Keep `HomePage` and current `home.json` unchanged unless shared infrastructure requires non-breaking additions.

### Suggested Component Structure

```text
src/pages/home-v2/HomeV2Page.tsx
src/components/home-v2/HomeV2Hero.tsx
src/components/home-v2/HomeV2LearningThread.tsx
src/components/home-v2/HomeV2ParentConfidence.tsx
src/components/home-v2/HomeV2SwissTrust.tsx
src/components/home-v2/HomeV2FinalCta.tsx
src/components/home-v2/HomeV2Reveal.tsx
src/components/home-v2/HomeV2Button.tsx
```

### Deliverables

- New route available locally.
- Empty or low-fidelity page scaffold.
- Translation namespace loaded.
- No change to `/`.

### Acceptance Criteria

- `/home-v2` renders without requiring authentication.
- `/` still renders the current homepage.
- Existing public pages continue routing normally.
- `npm run lint` and `npm run build` pass.

### Dependencies

- React Router setup.
- i18n namespace registration.
- Marketing layout or Home V2-specific layout decision.

### Risks

- Accidentally replacing `/` too early.
- Reusing too many old homepage components and inheriting their problems.
- Adding untranslated visible text directly in components.

## Milestone 5: Hero Experience

### Objective

Build the first viewport as a premium, parent-facing Swiss family homework moment.

### Narrative Goal

The parent should immediately understand:

- This is for families.
- It is about homework getting unstuck.
- Teacher-backed support exists.
- The product is calm and trustworthy.

### Suggested Copy Direction

Working headline options:

- `When homework gets stuck, learning can still move calmly.`
- `Calm support for the moment homework gets difficult.`
- `Clear learning support, before homework becomes a family argument.`

CTA:

- Primary: `Start learning`
- Secondary: `See how STOA helps`

### Scope

- Implement editorial hero composition.
- Use family/homework imagery as the visual anchor.
- Add restrained trust cues.
- Add primary and secondary CTAs.
- Avoid visible AI-first positioning.
- Ensure mobile first viewport remains clear without text/image collision.

### Deliverables

- Fully implemented `HomeV2Hero`.
- Hero copy in `homeV2.json`.
- Desktop and mobile screenshots.

### Acceptance Criteria

- First viewport clearly targets Swiss parents.
- Main headline is short enough to be remembered.
- CTA hierarchy is obvious.
- Page does not look like a SaaS template.
- Text does not overlap images at mobile or desktop breakpoints.
- There is a hint of the next section below the fold.

### Dependencies

- Milestone 3 image decision.
- Milestone 4 scaffold.
- CTA routing decision.

### Risks

- Headline becomes too abstract.
- Hero image does not carry enough family context.
- CTA becomes too salesy or too demo-like.

## Milestone 6: Learning Thread Interaction And Motion

### Objective

Make the product mechanism understandable through one memorable animated learning thread.

### Story Sequence

The thread should show:

1. Student asks a homework question.
2. STOA gives a clear next step.
3. Teacher support can connect if needed.
4. Parent sees the learning pattern.

### Motion Principles

- Motion must carry meaning, not decoration.
- Use `IntersectionObserver` or CSS reveal helpers.
- Animate transform and opacity only.
- Respect `prefers-reduced-motion`.
- Avoid continuous scroll listeners.
- Avoid heavy blur on scrolling content.

### Scope

- Build `HomeV2LearningThread`.
- Design a premium learning-thread UI, not a dense dashboard.
- Add staged reveal animation.
- Include a compact practice cue, but not a full Practice Path module.
- Include teacher and parent states as connected thread events.

### Deliverables

- Animated thread component.
- Motion helper or reveal component.
- Reduced-motion behavior.
- Desktop and mobile interaction checks.

### Acceptance Criteria

- The thread explains the STOA mechanism without a long paragraph.
- Animation remains smooth on mobile.
- Reduced-motion mode still presents the full story.
- Practice is present only as part of the learning path, not as a competing homepage module.
- No element appears broken or hidden if JavaScript animation setup fails.

### Dependencies

- Milestone 2 visual direction.
- Milestone 8 copy.
- Existing product concepts: chat, practice, teacher support, parent visibility.

### Risks

- Animation becomes gimmicky.
- Thread UI starts looking like a dashboard.
- Too many steps recreate the old text-heavy problem.

## Milestone 7: Parent Confidence And Swiss Trust Sections

### Objective

Build the sections that address parent anxieties and Swiss-market trust.

### Parent Confidence Themes

- Parents do not need to solve the homework.
- Parents can see where the child is stuck.
- Teacher support is connected to the learning moment.
- The child keeps ownership of the work.

### Swiss Trust Themes

- Designed around Swiss family routines and schoolwork.
- Works for multilingual family contexts.
- Teacher-backed support when more guidance is needed.
- Privacy-conscious and restrained.
- Calm enough for repeated weekly use.

### Scope

- Build `HomeV2ParentConfidence`.
- Build `HomeV2SwissTrust`.
- Replace generic feature cards with editorial panels, proof points, or quiet trust statements.
- Avoid overclaiming compliance, pedagogy, or market coverage.

### Deliverables

- Parent confidence section.
- Swiss trust section.
- Copy in `homeV2.json`.
- Desktop/mobile screenshots.

### Acceptance Criteria

- A Swiss parent can identify the value without reading product documentation.
- Section copy is specific and credible.
- The page avoids vague claims like `Ready to grow`.
- Layout does not become another card grid.
- Teacher support and parent visibility feel connected, not separate features.

### Dependencies

- Milestone 1 IA.
- Milestone 8 copy.
- Product truth boundaries from current implementation.

### Risks

- Making claims that require legal/product review.
- Sounding too generic about Switzerland.
- Overloading the page with reassurance text.

## Milestone 8: Copy System And English Lock

### Objective

Write and lock the English Home V2 copy before translation.

### Copy Principles

- Parent-facing.
- Short sentences.
- No hero-level AI language.
- Avoid generic SaaS phrases.
- Avoid explaining every feature.
- Prefer concrete family learning situations.
- Keep claims modest and defensible.

### Scope

- Create `src/i18n/locales/en/homeV2.json`.
- Write all visible section copy.
- Define CTA labels.
- Define alt text.
- Define any legal or trust caveats needed.
- Remove placeholder or demo-sounding language.

### Deliverables

- English copy deck in JSON.
- Copy review notes.
- Final English copy lock.

### Acceptance Criteria

- Hero headline is concise and parent-facing.
- CTA language uses `Start learning`, not hard demo language.
- The word `AI` is absent from hero-level copy unless later explicitly approved.
- The page has materially less copy than the current homepage.
- Copy does not include unsupported operational claims.

### Dependencies

- Milestones 1, 5, 6, and 7.
- Current product capability boundaries.
- Pricing and registration flow language.

### Risks

- Copy becomes too vague after reducing product details.
- Translation later reveals English strings are too idiomatic.
- CTA flow does not match actual registration behavior.

## Milestone 9: Multilingual Localization And Layout QA

### Objective

Localize Home V2 into supported languages and verify visual stability.

### Supported Locales

- English.
- German.
- French.
- Italian.

### Scope

- Add `homeV2.json` for DE, FR, and IT.
- Review German long-string behavior.
- Review French and Italian CTA wrapping.
- Ensure locale-specific hero line breaks do not break the design.
- Add layout helpers only if needed.

### Deliverables

- `src/i18n/locales/de/homeV2.json`
- `src/i18n/locales/fr/homeV2.json`
- `src/i18n/locales/it/homeV2.json`
- Locale visual QA notes.
- Screenshots for key breakpoints.

### Acceptance Criteria

- No missing translation keys.
- No visible fallback English in localized pages unless intentionally deferred.
- No horizontal overflow at mobile widths.
- CTA buttons remain readable.
- Hero title and learning-thread cards do not collide with imagery.

### Dependencies

- English copy lock.
- i18n namespace setup.
- Existing locale layout helpers if needed.

### Risks

- German copy forces excessive hero height.
- Literal translation weakens the Swiss parent tone.
- Locale QA gets skipped because English looks good.

## Milestone 10: Visual QA, Comparison, And Launch Decision

### Objective

Decide whether Home V2 is ready to replace the current homepage.

### Scope

- Run desktop and mobile screenshots for current `/` and new `/home-v2`.
- Compare first viewport clarity.
- Compare copy density.
- Compare visual quality.
- Check animation behavior.
- Check accessibility basics.
- Check registration/CTA routing.
- Decide whether to:
  - Keep `/home-v2` as a preview.
  - Iterate more.
  - Switch `/` to Home V2.

### Deliverables

- Visual QA report.
- Before/after screenshots.
- Known issues list.
- Launch decision note.
- Switch plan if approved.

### Acceptance Criteria

- `npm run lint` passes.
- `npm run build` passes.
- Desktop and mobile screenshots pass visual review.
- Reduced-motion mode is acceptable.
- No mobile horizontal overflow.
- No broken images.
- No missing translations.
- CTA route behavior is verified.
- Existing `/` remains available until the switch is explicitly approved.

### Dependencies

- Milestones 1 through 9.
- Stakeholder review.
- Current deployment process.

### Risks

- Home V2 looks better but converts worse due to unclear CTA.
- Animation harms performance on low-end devices.
- Launch decision happens before translation QA.
- The old and new homepage diverge in routing or CTA behavior.

## Cross-Milestone Workstreams

### Design

- Homepage narrative.
- Premium editorial layout.
- Image treatment.
- Motion choreography.
- Responsive behavior.

### Engineering

- Route isolation.
- Component namespace.
- Translation namespace.
- CSS helper classes.
- Animation helpers.
- Playwright checks.

### Content

- English copy lock.
- Localized copy.
- Alt text.
- CTA consistency.
- Trust and product-claim boundaries.

### QA

- Visual screenshots.
- Mobile overflow.
- Reduced motion.
- i18n layout.
- CTA routing.
- Build/lint verification.

## Suggested Execution Order

Milestones should run sequentially, with only limited overlap:

1. Complete Milestone 1 before any implementation.
2. Complete Milestones 2 and 3 together before building the final hero.
3. Complete Milestone 4 before feature section implementation.
4. Complete Milestone 5 before Milestones 6 and 7.
5. Draft copy throughout Milestones 5 to 7, but lock it in Milestone 8.
6. Complete localization only after English copy is stable.
7. Run final QA only after localization and animation are complete.

## Initial File Map

Likely new files:

```text
docs/home/home-v2-redesign-milestones.md
src/pages/home-v2/HomeV2Page.tsx
src/components/home-v2/HomeV2Hero.tsx
src/components/home-v2/HomeV2LearningThread.tsx
src/components/home-v2/HomeV2ParentConfidence.tsx
src/components/home-v2/HomeV2SwissTrust.tsx
src/components/home-v2/HomeV2FinalCta.tsx
src/components/home-v2/HomeV2Reveal.tsx
src/components/home-v2/HomeV2Button.tsx
src/i18n/locales/en/homeV2.json
src/i18n/locales/de/homeV2.json
src/i18n/locales/fr/homeV2.json
src/i18n/locales/it/homeV2.json
```

Likely touched files:

```text
src/app/router/AppRouter.tsx
src/i18n/namespaces.ts
docs/home/home-v2-redesign-milestones.md
```

The existing homepage files under `src/components/home/` should remain unchanged until a final switch decision.

## Open Questions

These should be resolved before Milestone 5 implementation:

- Should the preview route be `/home-v2`, `/swiss-family-home`, or another name?
- Are existing local images acceptable for the first version, or should new Swiss-family imagery be generated/sourced first?
- Should the final CTA route to `/login?next=/chat`, `/register`, or a new guided onboarding path?
- Should Home V2 use the current `MarketingLayout` or a more immersive Home V2-specific public layout?
- Which language should be treated as the source of truth for Swiss-market copy: English first, or German first?
