# Phase 34 Practice Scope Regression Checklist

## Product Scope

- [x] Practice Path is documented as a general middle-school and high-school learning challenge system.
- [x] Equations are documented as the first Mathematics demo content package.
- [x] Canonical hierarchy is Practice Path -> Subject -> Grade level -> Topic -> Unit -> Lesson -> Challenge.
- [x] Source types and mock data include subject, grade level, topic, unit, lesson, and challenge metadata.
- [x] No type or route name encodes `EquationPath` or `EquationPracticePage`.

## Routes

- [x] `/practice` remains the student overview route.
- [x] `/practice/:subjectId/:topicId` is the canonical topic route shape.
- [x] `/practice/:subjectId/:topicId/lessons/:lessonId` loads lesson flow.
- [x] Legacy subject-only Practice routes remain registered for compatibility.
- [x] Practice links use `src/lib/practiceRoutes.ts`.

## Copy

- [x] Homepage Practice entry says short challenges in school topics.
- [x] Dashboard copy says Practice Path / current school topic, not equation practice as the product.
- [x] `/practice` copy says guided practice and labels Mathematics / Equations as available-now content.
- [x] Parent summary says current school topic and current Practice topic.
- [x] English, German, French, and Italian homepage Practice entry labels render.

## Browser QA

- [x] Unauthenticated Start Practice opens `/login?next=/practice`.
- [x] Student login with `student@test.com` redirects to `/practice`.
- [x] `/practice` shows generalized Practice copy and Mathematics / Equations as demo content.
- [x] `/practice/mathematics/equations` loads.
- [x] `/practice/mathematics/equations/lessons/lesson-linear-2` loads.
- [x] `/dashboard` shows generalized Practice card copy.
- [x] Four-language mobile homepage checks at 390 px have no horizontal overflow.

## Build

- [x] `npm run build` passes.
