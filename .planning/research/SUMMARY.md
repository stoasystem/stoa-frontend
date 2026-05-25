# Research Summary

**Milestone:** v1.14 Phase 15: Homepage Redesign, Onboarding Flow, and Premium UI Refinement
**Researched:** 2026-05-25
**Confidence:** HIGH

## Key Findings

### Stack Additions

No major dependency additions are needed. The existing React, TypeScript, Vite, TailwindCSS, TanStack Query, Axios/fetch services, and lucide-react stack can support the milestone. CSS transitions and keyframes are preferable to adding a motion library for this scope.

### Feature Table Stakes

- Student-first homepage CTA.
- Sequential learning flow replacing parallel AI/teacher/parent cards.
- Multi-step role-based registration for student, parent, and tutor.
- Student parent-link fields.
- Parent child-profile fields.
- Tutor teaching profile and credential upload UI.
- AI-first chat empty state.
- Inline teacher escalation after assistant responses.
- Demo backend support for expanded register payloads and tutor credential mock upload.

### Differentiators

- Premium editorial education homepage with one strong visual memory.
- Parent visibility framed as support and progress, not a competing product module.
- Teacher support framed as contextual escalation, not a separate homepage entry.
- Local Swiss education context used carefully as trust texture rather than overclaiming.

### Watch Out For

- Do not recreate the same feature-bucket confusion with prettier cards.
- Do not make onboarding so long that student first value is delayed.
- Do not imply tutor credentials are truly verified.
- Do not use decorative images on mobile unless they help explain the product.
- Do not hard-code API calls inside components.

## Implementation Implications

1. Build homepage sections first, because they define the new product story.
2. Then add typed onboarding and register service support.
3. Then refine chat to make teacher escalation contextual.
4. Then update the demo backend, docs, QA, and build checks.

## Sources

- Appcues onboarding guide, 2026-05-19: onboarding is the full journey to repeatable value, not a one-time product tour.
- Nielsen Norman Group mobile image guidance, 2023-11-08: mobile images should add informational value.
- Openfield EdTech instructor onboarding article: education onboarding should reduce complexity and progressively scaffold new users.
- Tavi AI education product page, accessed 2026-05-25: effective child-facing AI tutoring can frame parent visibility and answer restraint under one product promise.
- arXiv 2605.11155, submitted 2026-05-11: hybrid human-AI tutoring can improve outcomes over AI-only baselines and supports differentiated human help.

---
*Research summary for: STOA Phase 15*
