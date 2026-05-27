# Project Research Summary

**Project:** STOA Frontend  
**Milestone:** v1.31 Phase 33  
**Domain:** Homepage Practice Entry Clarification and Learning Platform Funnel Optimization  
**Researched:** 2026-05-27  
**Confidence:** HIGH for implementation direction, MEDIUM-HIGH for user motivation transfer from Duolingo-like learning products to STOA's premium education context

## Executive Summary

Phase 33 should make the homepage Practice entry feel more fun by making it clearer, shorter, and more immediately actionable, not by turning STOA into a game. The strongest transferable pattern from Duolingo-inspired products is the learning loop: a short challenge, visible progress path, immediate feedback, hints before escalation, and a clear next step into explanation. For STOA, that loop must remain inside the platform hierarchy: Practice starts the work, Learning Chat explains stuck steps, professional teacher support escalates unresolved confusion, and Parent Report gives calm visibility.

The recommended approach is a frontend-only refinement of the existing homepage module. Keep the current React/TypeScript/Vite stack and existing Practice routes. Split the homepage Practice section into a clear entry card, a restrained challenge/path preview, and connected outcome cues for Learning Chat, Teacher Support, and Parent Report. Add role-aware Practice CTA routing so unauthenticated users go through `/login?next=/practice`, students reach `/practice`, and parent/tutor/admin roles avoid student-only routes.

The main risks are over-gamification, CTA confusion, route/auth mismatch, mobile localization overflow, and accidental Duolingo brand imitation. Mitigate them with STOA-safe principles: short challenge clarity, visible but calm progress, subtle motivation, immediate feedback, hint-first recovery, and contextual Learning Chat handoff. Do not copy Duolingo code, branding, visual style, mascot cues, bright green palette, XP, streaks, hearts, gems, leaderboards, shops, or game-first product positioning.

## Key Findings

### Recommended Stack

No new UI, game, animation, sound, state-machine, analytics, or gamification dependency is recommended. The existing stack is sufficient: React, TypeScript, Vite, React Router, i18next, lucide-react icons, existing STOA theme tokens, and current Practice routes/components.

**Core technologies:**
- React + TypeScript: homepage component split and typed presentational preview data.
- React Router: preserve existing `/practice`, `/chat`, role home routes, and login-next flow.
- i18next home namespace: localize entry copy, challenge labels, path steps, and support handoff for EN/DE/FR/IT.
- STOA theme CSS/tokens: keep premium burgundy, warm paper, charcoal, and restrained accent styling.
- lucide-react: use generic education/support icons such as route, hint, chat, graduation, panels, and check icons.
- CSS transitions with `prefers-reduced-motion`: allow subtle hover/checkmark feedback only when motion preferences permit.

### Stack Additions

- Add no package dependencies.
- Add or refine only local components/utilities: `PracticeEntryCard`, `HomePracticePreview`, `PracticeMiniPath`, `PracticeConnectedOutcomes`, and `startPracticeNavigation`/`getStartPracticePath`.
- Keep static homepage preview data in i18n or a small typed constant; do not add persisted gamification state.

### Expected Features

Phase 33 should optimize activation and comprehension, not build a new learning engine.

**Must have (table stakes):**
- One visible homepage Practice CTA that makes Practice the primary learning entry.
- Short practice promise near the CTA: short, guided, educational.
- One concrete challenge preview with prompt, answer affordance, hint affordance, and `Explain this step` relationship.
- Restrained path preview showing current topic, next step, and review/mistake loop.
- Hint-before-chat framing.
- Contextual Learning Chat handoff carrying the current work conceptually: topic, prompt, answer, correctness, hint use, and attempt count.
- Delayed teacher escalation and parent visibility framing.
- EN/DE/FR/IT mobile readability with no clipped CTA/card text.

**Should have (differentiators):**
- Premium guided-start panel that feels like trusted tutoring, not casual entertainment.
- "Try, then explain" hierarchy: Practice first, Learning Chat second, teacher support third.
- Parent-safe learning narrative that shows visibility without surveillance.
- Human teacher support as a premium backstop.
- Practice-to-report continuity as a small confidence cue.

**Defer (v2+):**
- Full curriculum expansion, diagnostics, new subjects, or lesson authoring.
- Adaptive personalization claims not backed by real data.
- New AI tutor capabilities beyond Practice-to-Learning-Chat handoff.
- Production analytics buildout unless explicitly scoped.
- Paywall/pricing funnel work.
- Any complex gamification economy or reward system.

### Feature Table Stakes

- `Start Practice` / `Start learning` action is unambiguous and routes correctly.
- The preview answers "What happens after I click?" before the user commits.
- The user can see a short progress path without interpreting it as points, levels, or a game board.
- The stuck-step flow is clear: try independently, use a hint, open Learning Chat with context, escalate to teacher if still unclear.
- Parent Report remains the visibility endpoint, not a performance-judgment or surveillance promise.

### Architecture Approach

Keep Practice as a homepage section in the public marketing flow, not a new public route or top-level navbar item. The existing homepage already places `HomePracticeEntry` after the hero and before the broader learning flow, and `/practice` is already a protected student route. Phase 33 should refactor the section for clarity and routing correctness without backend/database changes.

**Major components:**
1. `HomePracticeEntry` — section shell and composition.
2. `PracticeEntryCard` — copy, primary CTA, secondary CTA, and role-aware start action.
3. `HomePracticePreview` — concrete challenge/path/support preview using existing Practice-to-Chat framing.
4. `PracticeMiniPath` — ordered 3-4 step path with accessible current-step state.
5. `PracticeConnectedOutcomes` — Learning Chat, Teacher Support, Parent Report outcome cues.
6. `startPracticeNavigation` / `getStartPracticePath` — central routing helper for unauthenticated and authenticated roles.

### Architecture Implications

- Public users clicking Practice should go to `/login?next=/practice`.
- Authenticated students should go directly to `/practice`.
- Parent, tutor, admin, and organization roles should route to their existing role homes, not `/practice`.
- Login success must honor safe student-owned `next` paths such as `/practice`; otherwise the homepage CTA promises Practice but lands students on `/dashboard`.
- Keep changes in existing `home` i18n resources; do not introduce a new namespace.
- Update QA/demo docs only if Phase 33 execution scope includes documentation; this synthesis should inform those later changes.

### Critical Pitfalls

1. **Over-gamification reframes STOA as a game** — use progress as orientation, not reward; avoid XP, coins, hearts, streak pressure, leaderboards, mascots, shops, and "play" language.
2. **CTA competition splits the homepage funnel** — keep one dominant learning CTA and use secondary actions only for explanation.
3. **Public Practice CTA breaks auth expectations** — centralize role-aware routing and verify `/login?next=/practice` lands students on Practice.
4. **Misleading product hierarchy** — always show Practice as the entry to Learning Chat, teacher support, and Parent Report, not as the whole product.
5. **Localized mobile overflow** — test EN/DE/FR/IT at narrow widths; allow wrapping and avoid fixed single-line button/card assumptions.
6. **Duolingo visual or brand copying** — borrow cadence and feedback patterns only; avoid Duolingo green, mascot/brand cues, clone-like mechanics, and user-facing "Duolingo-style" wording.

### Watch Outs

- Do not add Practice to the public navbar.
- Do not send every authenticated role to `/practice`; non-students will hit role guards.
- Do not make the challenge preview a new mini-app or real practice engine.
- Do not overpromise "personalized" or "adaptive" behavior unless existing product data supports it.
- Do not let parent-facing language become surveillance or mistake-shaming.
- Do not rely on screenshots alone for mobile QA; check `scrollWidth` against viewport width.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Funnel and Route Contract

**Rationale:** The CTA promise must be correct before visual polish or testing. If users click Practice and land on the wrong page, all feedback is contaminated.  
**Delivers:** Role-aware Practice CTA path helper, safe login-next handling for student Practice, and route matrix verification.  
**Addresses:** Primary Practice CTA, authenticated/unauthenticated flow, delayed role-specific destinations.  
**Avoids:** Auth expectation failures, `/forbidden` for non-students, CTA confusion.

### Phase 2: Homepage Practice Entry UI

**Rationale:** Once routing is correct, the homepage needs a concrete, STOA-safe Practice preview that makes the short learning loop obvious.  
**Delivers:** Entry card, challenge preview, mini path, immediate feedback/hint copy, Learning Chat handoff cue, connected outcomes row.  
**Uses:** Existing React, i18n, lucide-react, STOA theme tokens, reduced-motion CSS.  
**Implements:** `HomePracticeEntry`, `PracticeEntryCard`, `HomePracticePreview`, `PracticeMiniPath`, `PracticeConnectedOutcomes`.  
**Avoids:** Game-first positioning, complex gamification, Duolingo visual imitation.

### Phase 3: Cross-Locale Mobile and Accessibility QA

**Rationale:** The highest implementation risk after routing is visual breakage from long localized copy and dense preview content.  
**Delivers:** EN/DE/FR/IT viewport checks at 320/375/430/768/1024/1440px, no horizontal scroll, stable button wrapping, keyboard order, and reduced-motion behavior.  
**Addresses:** Mobile-first readability, accessible ordered path, CTA target clarity.  
**Avoids:** Overflow, clipped labels, motion discomfort, dense mobile block.

### Phase 4: User Testing Readiness and Funnel Rubric

**Rationale:** "Fun" should be validated as clarity, motivation, and trust, not just clicks. Testing scripts must measure whether users understand the Practice -> Chat -> teacher -> parent sequence.  
**Delivers:** Test prompts/rubric for students, parents, and teachers; issue categories for hierarchy, CTA, auth, locale fit, mobile layout, brand risk, and trust.  
**Addresses:** Comprehension of Practice, Learning Chat handoff, parent trust, teacher support context.  
**Avoids:** Optimizing only for clicks, collecting vague feedback, or missing hierarchy confusion.

### Phase Ordering Rationale

- Routing comes first because it is a dependency for credible homepage activation.
- UI refinement comes second because it relies on a settled CTA contract.
- Localization/accessibility QA follows UI because German/French/Italian labels and dense mobile layouts are the most likely regressions.
- Testing readiness comes last because the test rubric should reflect the final CTA and UI behavior.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4:** Needs user-testing protocol detail if STOA will run live student/parent/teacher sessions.
- **Future analytics phase:** Needs event taxonomy and privacy review before production tracking.
- **Future adaptive learning phase:** Needs backend/data research before any personalization claims.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Route helper and login-next validation are codebase-specific and well documented by the architecture research.
- **Phase 2:** Component split and presentational preview patterns are straightforward in the existing React/i18n stack.
- **Phase 3:** Responsive, reduced-motion, and localization QA have established checks and WCAG guidance.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Research strongly supports no new dependency; existing React/TypeScript/Vite/i18n/router/theme stack is enough. |
| Features | MEDIUM-HIGH | Multiple learning products support short practice, visible path, mistake review, and explanations; STOA-specific trust framing still needs user validation. |
| Architecture | HIGH | Based on current repository evidence for homepage placement, protected routes, role defaults, login flow, i18n resources, and existing Practice-to-Chat components. |
| Pitfalls | HIGH for accessibility/brand/implementation, MEDIUM for gamification psychology | Guardrails are strongly supported by WCAG, brand-boundary sources, and codebase evidence; motivation effects should be validated with STOA users. |

**Overall confidence:** HIGH for Phase 33 roadmap structure, MEDIUM-HIGH for final copy/design effectiveness until tested with target users.

### Gaps to Address

- User motivation fit: validate whether students perceive the entry as more approachable without calling STOA a game.
- Parent trust: validate whether Practice plus Parent Report feels reassuring rather than surveillance-oriented.
- Teacher context: validate whether Practice-origin context is meaningful for professional support.
- Login/register parity: confirm `next=/practice` behavior through both sign-in and any registration/onboarding path in execution.
- Analytics scope: decide explicitly whether Phase 33 only documents future events or implements tracking.

## Sources

### Primary (HIGH confidence)

- Duolingo Method whitepaper — reference mechanics only; borrow short effort/progress/feedback, not reward economy or brand style: https://duolingo-papers.s3.amazonaws.com/reports/duolingo-method-whitepaper.pdf
- Material Web buttons — CTA hierarchy and high-emphasis button guidance: https://material-web.dev/components/button/
- W3C WCAG Understanding SC 2.3.3 Animation from Interactions — reduced-motion guidance: https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- W3C WCAG Understanding SC 1.4.10 Reflow — 320 CSS px reflow/no two-direction scroll guidance: https://www.w3.org/WAI/WCAG21/Understanding/reflow
- W3C WCAG Understanding SC 2.5.8 Target Size Minimum — mobile/touch target guardrails: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Repository evidence from architecture research: `src/pages/home/HomePage.tsx`, `src/components/home/HomePracticeEntry.tsx`, `src/components/home/HomePracticeToChatFlow.tsx`, `src/app/router/AppRouter.tsx`, `src/app/router/ProtectedRoute.tsx`, `src/app/router/RoleRoute.tsx`, `src/app/router/routeConfig.ts`, `src/lib/navigation.ts`, `src/lib/authRoutes.ts`, `src/hooks/auth/useLoginMutation.ts`, `src/i18n/index.ts`, `src/lib/localeLayout.ts`, `docs/ia/site-layout-with-practice-entry.md`, `docs/qa/phase31-practice-entry-checklist.md`, `docs/demo/practice-as-learning-chat-entry-demo.md`, `docs/demo/current-project-demo-guide.md`.

### Secondary (MEDIUM-HIGH confidence)

- Duolingo Practice tab and mistake review: https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- Super Duolingo premium practice positioning: https://www.duolingo.com/plus
- Duolingo `Explain My Answer`: https://blog.duolingo.com/explain-my-answer-now-free/
- Duolingo Max AI features and Practice Hub relationship: https://blog.duolingo.com/duolingo-max/
- Khan Academy AI responsibility guidance: https://support.khanacademy.org/hc/en-us/articles/42929379091725-How-can-I-use-Khan-Academy-s-AI-features-responsibly
- Brilliant learning paths and practice checkpoints: https://brilliant.org/help/using-brilliant
- Quizlet Learn personalized study path: https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn
- IXL diagnostic recommendations and personalized learning plan: https://www.ixl.com/diagnostic
- Duolingo Blog on streak design, used for boundary setting around loss-aversion dynamics: https://blog.duolingo.com/how-duolingo-streak-builds-habit/

### Tertiary / Cautionary (MEDIUM confidence)

- Negative Effects of Gamification in Education Software: https://arxiv.org/abs/2305.08346
- Advancing Gamification Research and Practice with Self-Determination Theory: https://link.springer.com/article/10.1007/s11528-024-00968-9
- Gamification misuse research: https://arxiv.org/abs/2203.16175
- Frontiers article on gamification risks, extrinsic rewards, stress, and balanced learning-centered design: https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1474733/full
- Duolingo official brand identity guidance, used only as a boundary source for visual/brand cues to avoid: https://design.duolingo.com/identity
- Baymard button UX research on clear primary actions, button prominence, mobile hit areas, and competing buttons: https://baymard.com/learn/button-design

---
*Research completed: 2026-05-27*  
*Ready for roadmap: yes*
