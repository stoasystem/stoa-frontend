# Feature Landscape: Phase 33 Practice Entry and Product Funnel

**Project:** STOA Frontend
**Research dimension:** Practice entry features and product funnel
**Researched:** 2026-05-27
**Overall confidence:** MEDIUM-HIGH

## Executive Recommendation

Phase 33 should not add a broader curriculum, a gamified practice economy, or a new learning engine. It should make the existing STOA homepage entry into Practice easier to understand, test, and explain: one primary `Start Practice` action, one short challenge preview, one restrained path preview, and clear escalation language that preserves the hierarchy:

`Practice -> Learning Chat -> Professional Teacher Support -> Parent Report`

The strongest pattern across current learning products is a low-friction entry into a short practice session, with enough preview to remove uncertainty and enough progress/path framing to make the session feel purposeful. Duolingo exposes on-demand practice, mistakes review, and skill-specific sessions from the home experience; Quizlet Learn uses a goal-based personalized study path; Brilliant uses learning paths with interactive checkpoints; IXL emphasizes exact next-skill recommendations. STOA should borrow the clarity and momentum, not the game layer.

## Table Stakes

Features users expect. Missing means the homepage-to-practice funnel feels incomplete.

| Feature | Why Expected | Complexity | Phase 33 Recommendation | Notes |
|---------|--------------|------------|--------------------------|-------|
| Primary `Start Practice` CTA | Practice products need a visible, unambiguous first action. Duolingo, Quizlet, Brilliant, and IXL all orient learners around starting or continuing a recommended practice unit. | Low | Include | On homepage, this should be the main student learning CTA. It should route to the existing Practice entry or authenticated practice destination, not to generic marketing content. |
| Short practice promise near CTA | Users need to know what happens after clicking. | Low | Include | Say the session is short, guided, and educational. Avoid "play", "game", "streak", "XP", or entertainment-first copy. |
| Challenge preview | Premium education funnels benefit from showing the actual task before asking users to commit. | Low-Med | Include | Show one realistic challenge card with prompt, answer area, and hint affordance. Keep it non-interactive or shallow if needed; the goal is comprehension, not a new practice engine. |
| Path preview | Learners and parents expect visible structure: where the learner is, what comes next, and why. | Med | Include | Show one restrained path segment: current topic, next step, and a review/mistake step. Do not create a full curriculum browser. |
| Mistake review concept | Duolingo's Practice tab and Super positioning both treat mistake review as a core practice value. | Low-Med | Include | Frame as "review unclear steps" or "practice what was difficult", not punishment. |
| Hint before chat | A hint is the lightest intervention and should come before opening Learning Chat. | Low | Include | The funnel should show: try independently, use hint, then ask Learning Chat if still unclear. |
| Contextual Learning Chat handoff | AI/chat help is table stakes only when it is attached to the current learning context. | Med | Include | `Explain this step` should carry topic, prompt, learner answer, correctness, hint used, and attempt count into Learning Chat. |
| Delayed teacher escalation | Premium positioning depends on human support being available, not replacing practice or chat. | Med | Include | Show teacher support as "after trying Practice, hint, and Learning Chat." This protects the hierarchy. |
| Parent visibility endpoint | STOA's value proposition includes parent-readable progress. | Med | Include as funnel framing | The homepage entry can mention parent visibility, but Phase 33 should test comprehension rather than redesign Parent Report. |
| Mobile-first CTA and preview readability | Learning entries are often mobile-first. | Med | Include | The CTA, preview challenge, and path preview must remain readable at mobile widths and across EN/DE/FR/IT copy lengths. |

## Differentiators

Features that should make STOA feel premium and education-first rather than like a game clone.

| Feature | Value Proposition | Complexity | Phase 33 Recommendation | Notes |
|---------|-------------------|------------|--------------------------|-------|
| Premium guided-start panel | Makes Practice feel like a high-trust tutoring entry rather than a casual game. | Low-Med | Include | Use restrained editorial design, clear next step, and one concrete subject example. |
| "Try, then explain" hierarchy | Distinguishes STOA from generic chat-first tutoring by making practice the first learning act. | Low | Include | Homepage and practice entry should make the sequence obvious: try a step, get a hint, ask Learning Chat, escalate to teacher if needed. |
| Parent-safe learning narrative | Converts parent concern into trust without creating anxiety. | Med | Include | Copy should say parents can see what was practiced and where support helped, not monitor every mistake. |
| Human teacher as premium backstop | Clarifies that STOA is not just an AI tool. | Med | Include | Professional teacher support should appear as a credible escalation layer after Learning Chat, not as the primary CTA. |
| One-step challenge preview | Gives users proof of the product experience without adding a demo maze. | Low-Med | Include | Better than a generic product screenshot because it previews the core behavior in context. |
| Practice-to-report continuity | Shows that practice activity becomes meaningful parent insight. | Med | Include as messaging | Keep this as a small preview or copy bridge; do not expand reports in Phase 33. |

## Anti-Features

Features to explicitly not build for Phase 33.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Complex gamification: XP economy, gems, hearts, leaderboards, shops, streak pressure | STOA must remain premium education, and gamification can distort learning motivation or make the product feel childish. | Use calm progress, topic labels, and "next recommended step." |
| Representing STOA as a game | Conflicts with parent trust and professional teacher support positioning. | Use "Practice", "Learning Chat", "teacher support", and "Parent Report" language consistently. |
| Full curriculum expansion | The scope is homepage entry and funnel clarity, not course authoring. | Preview one existing path/topic and defer broad curriculum decisions. |
| Adaptive personalization claims | Hard to substantiate without backend learning data and risks overpromising. | Say "recommended" only when backed by existing demo data; otherwise say "example path." |
| Chat-first homepage | Weakens STOA's required hierarchy and makes Practice look secondary. | Make `Start Practice` primary, with Learning Chat as the explanation layer. |
| Teacher-first CTA | Turns STOA into a tutoring marketplace and bypasses the product's self-guided learning flow. | Present teacher support as a safety net after Practice and Learning Chat. |
| Parent surveillance framing | Can create anxiety and undermine student agency. | Present Parent Report as a calm summary of learning activity and support moments. |
| Paywall or pricing funnel work | Phase 33 is about learning-entry comprehension and user testing readiness. | Keep conversion as homepage-to-practice activation, not checkout conversion. |
| New AI tutor capabilities | Adds technical and safety complexity outside the entry funnel. | Reuse existing Learning Chat handoff and context card behavior. |
| Production analytics buildout | Useful later, but not necessary for product-funnel research. | Document suggested events for future implementation, but do not add tracking in Phase 33 unless already planned. |

## Feature Dependencies

```text
Homepage `Start Practice` CTA
  -> Practice entry/intro page
  -> First challenge
  -> Mistake or uncertainty state
  -> Hint
  -> `Explain this step` Learning Chat handoff
  -> Professional Teacher Support escalation if still unclear
  -> Parent Report learning activity summary

Challenge preview
  -> Needs one concrete prompt, expected answer affordance, and hint affordance
  -> Should visually match the real Practice surface

Path preview
  -> Needs one current topic, one next step, and one review/mistake step
  -> Should not require broad curriculum data
```

## Phase 33 Inclusion Recommendation

Prioritize:

1. Homepage `Start Practice` CTA with copy that makes Practice the first step in the STOA learning hierarchy.
2. Short challenge preview that shows a real-looking prompt, answer affordance, hint affordance, and `Explain this step` relationship without building new challenge mechanics.
3. Restrained path preview showing current topic, next recommended practice, and review/mistake loop.
4. Funnel copy and test prompts that validate whether users understand: Practice first, Learning Chat second, teacher support third, Parent Report last.
5. Documentation or test-task updates that ask students and parents what they expect after clicking `Start Practice`.

Defer:

- Additional subjects, lessons, diagnostics, or curriculum authoring.
- New gamification, rewards, streaks, or competitive mechanics.
- New AI chat abilities beyond context handoff from Practice.
- Parent Report UI redesign beyond confirming that the funnel message is understandable.
- Tutor workflow expansion beyond preserving teacher support as delayed escalation.

## Conversion Notes

For Phase 33, "conversion" should mean activation from homepage to Practice, not paid conversion. The key questions to test are:

- Can a new visitor identify `Start Practice` as the primary next step?
- Does the challenge preview make the product feel concrete and credible?
- Does the path preview make the practice session feel purposeful without implying a full curriculum expansion?
- Do students understand that Learning Chat helps with a specific stuck step?
- Do parents understand that teacher support and Parent Report come after student practice, not before it?

Suggested future analytics events, if tracking becomes in-scope later:

| Event | Purpose | Phase 33 Status |
|-------|---------|-----------------|
| `homepage_start_practice_click` | Measure primary CTA activation. | Document only unless analytics work is explicitly in scope. |
| `homepage_challenge_preview_seen` | Understand whether users reach the preview section. | Document only. |
| `practice_hint_opened` | Measure first support layer usage. | Existing/future product analytics concern. |
| `practice_explain_step_clicked` | Measure Practice-to-Learning-Chat handoff. | Existing/future product analytics concern. |
| `teacher_support_from_practice_clicked` | Measure delayed escalation. | Existing/future product analytics concern. |

## Source-Based Findings

| Finding | Evidence | Confidence |
|---------|----------|------------|
| On-demand practice and mistake review are table stakes in Duolingo-inspired products. | Duolingo's Practice tab offers on-demand practice for mistakes and specific skills; Super Duolingo markets personalized practice and mistakes review. | HIGH |
| In-lesson explanation after correct or incorrect answers is now expected in premium learning UX. | Duolingo's `Explain My Answer` provides personalized in-lesson feedback and moved from paid Max to broader availability. | HIGH |
| AI help should support learning, not replace learner thinking. | Khan Academy's AI guidance says AI tools support active learning rather than doing the work for students. | HIGH |
| Path and checkpoint framing are standard for premium interactive learning. | Brilliant describes learning paths, interactive lessons, and regular practice checkpoints. IXL describes personalized next-skill recommendations. | HIGH |
| Goal-based short practice sessions are a common conversion entry. | Quizlet Learn starts with choosing a goal and creates a personalized study path; free users can try a study session. | HIGH |
| Gamification should be handled cautiously. | Research on gamification misuse in language-learning apps flags the risk of game mechanics undermining learning goals. | MEDIUM |

## Sources

- Duolingo Practice tab and mistake review: https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- Super Duolingo premium practice positioning: https://www.duolingo.com/plus
- Duolingo `Explain My Answer`: https://blog.duolingo.com/explain-my-answer-now-free/
- Duolingo Max AI features and Practice Hub relationship: https://blog.duolingo.com/duolingo-max/
- Khan Academy AI responsibility guidance: https://support.khanacademy.org/hc/en-us/articles/42929379091725-How-can-I-use-Khan-Academy-s-AI-features-responsibly
- Brilliant learning paths and practice checkpoints: https://brilliant.org/help/using-brilliant
- Quizlet Learn personalized study path: https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn
- IXL diagnostic recommendations and personalized learning plan: https://www.ixl.com/diagnostic
- Gamification misuse research: https://arxiv.org/abs/2203.16175
