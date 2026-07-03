# Home V2 Information Architecture

**Date:** 2026-07-03
**Status:** Draft for v2.6
**Related plan:** `docs/home/home-v2-redesign-milestones.md`

## Purpose

Home V2 is a separate homepage redesign track. It must not replace the current `/` homepage until the new route is implemented, reviewed, localized, visually checked, and explicitly approved for switch-over.

This document turns the agreed positioning into an information architecture contract for the first Home V2 redesign milestone.

## Positioning Contract

### Primary Audience

Swiss parents evaluating whether STOA can support their child's daily homework and learning routine.

The homepage should assume the parent is asking:

- Will this help my child when they are stuck?
- Is there credible teacher-backed support, not just software?
- Can I understand the learning pattern without taking over homework?
- Does this feel trustworthy for a Swiss family context?

### Secondary Audiences

Secondary audiences remain supported, but not equally weighted in the public homepage narrative:

| Audience | Home V2 treatment | Primary product surface |
|----------|-------------------|-------------------------|
| Students | Shown through the learning moment and `Start learning` CTA | Student dashboard, Practice, Learning Chat |
| Tutors | Mentioned as teacher-backed support | Tutor dashboard and support queues |
| Parents | Primary homepage audience, later app visibility user | Public homepage, Parent Report |
| Admin/technical maintainers | Not a marketing audience | Admin and internal operational pages |

### Positioning Sentence

STOA is a calm, teacher-backed intelligent learning support system for Swiss families.

### Tone Filter

Home V2 should read as:

- 70% Swiss private-school / high-end education service.
- 30% modern learning product.

This means the page should favor restraint, confidence, family trust, education credibility, and a clear learning thread. Product UI appears as evidence, not as the spectacle.

## What Home V2 Must Not Become

- Not an AI homework solver.
- Not a generic SaaS landing page.
- Not a feature catalog where Practice, Chat, Tutor Support, and Parent Report compete equally.
- Not a student-only game/practice page.
- Not a teacher marketplace page.
- Not a full product dashboard explanation.
- Not a route that replaces `/` before explicit approval.
- Not a page that claims OCR, automatic solving, guaranteed improvement, production video, or production teacher availability beyond existing product boundaries.

## Recommended Route And Namespaces

| Item | Recommendation | Rationale |
|------|----------------|-----------|
| Preview route | `/home-v2` | Neutral internal preview route; avoids SEO/product naming commitment. |
| Page component | `src/pages/home-v2/HomeV2Page.tsx` | Keeps implementation separate from current `src/pages/home/HomePage.tsx`. |
| Component namespace | `src/components/home-v2/` | Prevents accidental mixing with current home components. |
| Translation namespace | `homeV2` | Keeps EN/DE/FR/IT copy independent until switch-over. |
| Asset grouping | `img/home-v2/` if new assets are added | Keeps new visual assets auditable. |

## CTA Contract

Primary CTA:

```text
Start learning
```

Secondary CTA candidates:

```text
See how it works
For parents
```

CTA behavior to preserve for later implementation:

| User state | Primary CTA target |
|------------|--------------------|
| Logged out | `/register?next=/practice` or equivalent registration-first learning entry |
| Logged out, prefers login | `/login?next=/practice` |
| Student | `/practice` or the most relevant current learning entry |
| Parent | `/parent` |
| Tutor | `/tutor` |
| Admin | `/admin` |

Registration copy may explain that free users have a trial quota after account creation, but the hero should not lead with quota mechanics.

## Current Homepage Inventory

| Current section/component | Disposition | Home V2 treatment |
|---------------------------|-------------|-------------------|
| `HomeHero` | Rewrite | Move to Swiss family homework moment, parent-facing promise, restrained `Start learning` CTA. |
| `HomePracticeEntry` / `PracticeEntryCard` | Merge | Practice becomes one moment inside the learning thread, not the second major homepage block. |
| `HomeLearningFlow` | Keep and rewrite | Becomes the core scroll narrative: question, next step, teacher support, parent pattern. |
| `HomeTeacherFallback` | Merge | Teacher support becomes part of the learning thread and trust layer. |
| `HomeParentVisibility` | Keep and rewrite | Reframe as parent confidence: visibility without taking over homework. |
| `HomeTrustSection` | Keep and compress | Swiss trust layer; fewer claims, stronger local credibility. |
| `HomeCTASection` | Rewrite | Final CTA should be restrained and confident, not a duplicate feature explanation. |
| `HomeMagazineImage` | Reassess | Use only if imagery supports family/homework story and crop quality. |
| Public footer | Keep | Preserve trust/contact footer unless later visual milestone explicitly refines it. |
| Current navbar | Keep initially | Do not add public Practice clutter during IA phase. |

## Proposed Home V2 Section Order

### 1. Hero: Swiss Family Homework Moment

Purpose: Establish the parent problem and trust tone in the first viewport.

Content:

- A concise parent-facing headline.
- Supporting copy about stuck homework becoming a clear next learning step.
- Primary CTA: `Start learning`.
- Visual: Swiss family/homework image or carefully selected generated image.

Do not mention AI as the headline concept.

### 2. Learning Thread

Purpose: Replace feature-card overload with one narrative sequence.

Thread:

1. A student is stuck on a real school task.
2. STOA gives a clear next step.
3. If needed, teacher-backed support can join.
4. Parents see the pattern and next focus without doing the homework.

This is the core structure that later animation should support.

### 3. Parent Confidence

Purpose: Explain what parents gain.

Content direction:

- Less uncertainty around homework.
- A visible learning rhythm.
- No pressure for parents to become the tutor.
- A calmer way to know when a child needs more support.

### 4. Swiss Trust Layer

Purpose: Signal local fit and premium education credibility.

Content direction:

- Swiss family context.
- Multilingual readiness.
- Teacher-backed support.
- Privacy-conscious behavior without overclaiming compliance guarantees.

### 5. Final CTA

Purpose: One quiet conversion close.

Content:

- Restate the learning promise.
- `Start learning`.
- Optional secondary parent path if needed.

## Navigation Policy

Home V2 should keep public navigation restrained. Practice should not become a top-level public nav island unless a later product decision changes this. Practice is a student learning surface; the public homepage can explain it as part of the learning thread.

Suggested public nav emphasis:

- How it works
- Pricing
- Teacher support
- For parents or parent-facing anchor
- Login
- Start learning

## Multilingual IA Guardrails

### English

Use calm, premium education language. Avoid overexplaining. Keep hero copy short.

### German

German hero and CTA copy must be short and structurally native. Prefer compact phrases over literal translations of long English sentences.

Risk: long compound words can break hero and CTA layout.

### French

French copy should be elegant and clear, with careful apostrophe handling and no literal English structure.

Risk: explanatory copy can grow long and should not be forced into tiny cards.

### Italian

Italian can be warmer, but CTA labels still need compact button fit.

Risk: emotional copy can become too soft if not balanced with educational credibility.

## Handoff To Later Milestones

Milestone 2 needs this IA to define visual direction and design rules.

Milestone 3 needs this IA to decide which image moments are required:

- family/homework hero
- student learning focus
- teacher support
- parent visibility/trust

Milestone 4 needs this IA to scaffold route and namespaces.

Milestone 5 and 6 need this IA to implement hero and learning-thread animation without inventing new content structure.

Milestone 8 and 9 need this IA to write and localize final copy.

## Acceptance Checklist

- [ ] Current `/` homepage remains unchanged.
- [ ] Home V2 route remains separate during preview.
- [ ] Primary audience is Swiss parents.
- [ ] CTA language starts from learning, not a stiff trial or question prompt.
- [ ] Practice, Learning Assistant, teacher support, and parent visibility are one story.
- [ ] AI is not the hero concept.
- [ ] Every old homepage section has a disposition.
- [ ] EN/DE/FR/IT risks are known before final copy.
