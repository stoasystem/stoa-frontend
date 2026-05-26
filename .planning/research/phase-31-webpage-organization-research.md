# Phase 31 Webpage Organization Research

**Date:** 2026-05-26
**Milestone:** v1.29 Phase 31: Practice Game Entry Integration, Homepage Positioning, and Learning Platform Funnel Alignment

## Research Question

How should STOA present and organize Practice Path across the public website and role-specific app pages so it is visible as a learning entry point without making STOA look like a game platform or weakening Learning Chat as the core explanation center?

## Sources Reviewed

- Nielsen Norman Group, "The Difference Between Information Architecture (IA) and Navigation": https://www.nngroup.com/articles/ia-vs-navigation/
- Nielsen Norman Group, "Journey Mapping 101": https://www.nngroup.com/articles/journey-mapping-101/
- Nielsen Norman Group, "Audience-Based Navigation: 5 Reasons to Avoid It": https://www.nngroup.com/articles/audience-based-navigation/
- Nielsen Norman Group, "Flat vs. Deep Website Hierarchies": https://www.nngroup.com/articles/flat-vs-deep-hierarchy/
- Nielsen Norman Group, "Utility Navigation: What It Is and How to Design It": https://www.nngroup.com/articles/utility-navigation/
- Nielsen Norman Group, "Navigation: You Are Here": https://www.nngroup.com/articles/navigation-you-are-here/
- Nielsen Norman Group, "Menu Design Checklist": https://media.nngroup.com/media/articles/attachments/PDF_Menu-Design-Checklist.pdf
- Nielsen Norman Group, "Strategic Design for FAQs": https://media.nngroup.com/media/reports/free/Strategic_Design_for_Frequently_Asked_Questions.pdf
- Nielsen Norman Group, "Visual Design Principles": https://media.nngroup.com/media/articles/attachments/Principles_Visual_Design-A4.pdf
- Baymard Institute, "Dashboard Design: Dashboard Cards Must Be Highly Consistent and Appropriately Styled": https://baymard.com/blog/cards-dashboard-layout

## Findings

### 1. Define the information architecture before changing navigation

NN/g separates IA from navigation: IA defines content, functionality, structure, and naming; navigation is only the visible UI that helps users move through that structure. For Phase 31 this means STOA should first define the product hierarchy:

Practice Path -> Learning Chat -> Professional Teacher Support -> Parent Report

Then public navigation, student navigation, parent navigation, and tutor navigation should expose that hierarchy only where it helps the user's task.

### 2. Public navigation should remain task/topic oriented

NN/g warns that audience-based navigation can add cognitive effort unless the audience sections are distinct, clear, and justified. STOA already has parent- and teacher-specific public content, but Practice is not primarily a public marketing section. Practice is an authenticated student learning function. Keeping Practice out of the public navbar protects the public site from becoming overcrowded and keeps the main product promise centered on guided learning support.

Phase 31 implication:

- Public nav should stay close to: Home, How it works, Parents, Teachers, Pricing, Contact, Login, Start learning.
- Practice can appear on the homepage as an example and in the student app as a first-class action.
- Student nav should include Dashboard, Practice, Learning Chat, History, Profile.

### 3. Homepage presentation should use Practice as a concrete example, not a new primary product

Homepage guidance emphasizes clear purpose, concrete examples, action prompts, and simplicity. Practice should therefore sit after the hero as a tangible example of how learning begins, while the hero and main CTA continue to sell STOA's broader promise: clear explanations, teacher support, and parent visibility.

Phase 31 implication:

- Add a homepage section with a title like `Start with practice. Continue with clear explanations.`
- Use a compact flow: Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report.
- Keep `Start learning` as the primary CTA.
- Use `See how practice works` as a secondary CTA.
- Avoid game language such as `Play now`, `Quest`, `Gems`, or `Streak rewards`.

### 4. Role dashboards should prioritize next actions before explanatory detail

Dashboard guidance consistently points toward clear hierarchy: immediate action/status first, supporting context second, detailed history later. Baymard's dashboard-card research also supports consistent card anatomy so dashboard choices are easy to scan.

Phase 31 implication:

- Student Dashboard top actions: Continue Practice, then Ask a Question.
- Parent Dashboard should group Practice lessons, Chat questions, explanations, teacher support, and next focus into one `Learning activity` surface.
- Tutor request detail should show Practice context near the top because it changes how the tutor understands the request.

### 5. Wayfinding must be explicit in cross-page learning flows

NN/g's "You Are Here" guidance emphasizes page titles, active nav, breadcrumbs, visible step indicators, and contextual cues. Practice-to-Chat is a cross-page flow, so the user must understand where the chat context came from and how to return to the lesson.

Phase 31 implication:

- Learning Chat should show a Practice context card when opened from Practice.
- Chat should include a `Back to lesson` route when lesson context exists.
- Practice result and mistake-review screens should explain the next step clearly.
- Tutor detail should label `Source: Practice lesson` instead of using vague support language.

### 6. Q&A belongs on a categorized support page, not inside pricing

FAQ research favors scannable question labels, category grouping, and keeping the FAQ accessible when it supports decision-making. Phase 31 should preserve the recent direction of moving mixed pricing, student, parent, teacher, and application questions into a standalone categorized Q&A page.

Phase 31 implication:

- Pricing should keep only plan-specific information.
- Q&A should group questions by Student, Parent, Teacher, Pricing, Account, and Support.
- Questions should use the user's vocabulary rather than internal implementation terms.

### 7. Visual hierarchy should support the product hierarchy

NN/g visual design principles emphasize scale, visual hierarchy, contrast, and restraint. Practice can be visible without using playful or cartoon-like treatment.

Phase 31 implication:

- The Practice section should use the same premium STOA theme: burgundy, charcoal, warm neutrals, restrained cards, and editorial headings.
- Do not use bright game colors, cartoon rewards, oversized game panels, or gamified dominance.
- Button hierarchy should make Learning Chat and teacher support feel like support layers, not unrelated modules.

## Phase 31 Planning Principles

1. Practice is a student entry path, not the product's identity.
2. Learning Chat is the explanation center and must remain visible in every Practice-related flow.
3. Teacher support is an escalation after hints/retry/explanation, not the first response to normal mistakes.
4. Parent Report should show one learning story, not separate Practice and Chat silos.
5. Tutor pages should expose Practice context early and plainly.
6. Public navigation should stay uncluttered; authenticated student navigation can expose Practice directly.
7. CTAs should name the next action using calm education language.
8. Page structure should make location and return paths obvious.
9. Q&A should be categorized by user question, not mixed into Pricing.
10. Four-language copy should adapt naturally, especially for German button length and large headings.

## Recommended Page Organization

### Public Site

- Home
  - Hero: STOA learning support value
  - Practice entry example
  - How STOA works
  - Parent visibility
  - Teacher support
  - CTA
- How it works
- For parents
- For teachers
- Pricing
- Q&A
- Contact

### Student App

- Dashboard
  - Continue Practice
  - Ask a Question
  - Recent learning activity
  - Teacher support status
  - Learning history
- Practice
- Learning Chat
- History
- Profile

### Parent App

- Overview
  - Learning activity summary
  - Practice + Chat relationship
  - Recommended next focus
- Reports
- Billing
- Contact

### Tutor App

- Requests
  - Practice context when relevant
  - Student question and attempts
  - Hint and explanation state
- Availability
- Support

## Open Risks

- Practice may still look too prominent if homepage visual weight exceeds Learning Chat and teacher support.
- Too many CTAs in Practice feedback states may create decision fatigue.
- Parent report copy must avoid implying surveillance, failure, or ranking.
- Tutor context must be concise enough to help without making requests feel operationally heavy.
