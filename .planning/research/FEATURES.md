# Feature Research

**Domain:** STOA Phase 15 homepage, onboarding, and AI-first learning UI
**Researched:** 2026-05-25
**Confidence:** HIGH

## Feature Landscape

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Student-first homepage CTA | The product promise is learning help; students need the first action immediately. | LOW | `Start Learning` should route through login when needed and then to `/chat`. |
| Sequential learning explanation | Users need to understand AI, teacher, and parent roles as a flow. | LOW | Replace parallel cards with steps: ask, AI explains, teacher helps if needed, parent follows progress. |
| Role-based registration | Students, parents, and tutors need different setup questions. | MEDIUM | Use one multi-step page with typed role-specific profile payloads. |
| Student parent-link fields | Student onboarding must collect parent name/email for family visibility. | LOW | Demo response can return `parentLinked: true`. |
| Tutor credential upload UI | Tutor registration needs trust-building credential collection. | MEDIUM | Mock-upload PDF/PNG/JPEG up to 10 MB, then show pending review. |
| AI-first chat empty state | First-time student should ask directly, not choose a product module. | MEDIUM | Empty state should use homework-focused copy and default input. |
| Inline teacher escalation | Teacher help should appear after AI responses, not as a homepage module. | MEDIUM | Add message feedback/action component near assistant messages. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Premium editorial homepage | Makes STOA feel like a credible education product rather than a generic SaaS demo. | MEDIUM | Use image-driven composition, restrained colors, and dense-but-clear storytelling. |
| Swiss/local education trust context | Builds relevance and seriousness for families. | LOW | Keep claims modest and demo-safe. |
| Parent visibility as value layer | Shows family value without stealing student path priority. | LOW | Explain that parents can follow learning progress after student activity. |
| Pending review tutor state | Makes tutor onboarding feel realistic while staying demo-only. | MEDIUM | Avoid implying real approval. |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Three equal homepage cards for AI, teacher, parent | Easy to explain features separately. | Misrepresents the product as three parallel tools. | One student learning flow with teacher and parent roles contextualized. |
| Full production onboarding/auth | Feels complete. | Out of scope and creates backend/security debt. | Demo register contract and clear backend readiness notes. |
| Real tutor verification | Adds trust. | Requires operations, storage, review, legal, and security processes. | Mock credential upload and `pending_review` status. |
| Heavy animation library | Looks polished quickly. | Adds dependency and can hurt mobile performance. | CSS-only subtle fades, lifts, and focus transitions. |

## MVP Definition

### Launch With

- [ ] Magazine-style homepage with student-first CTA.
- [ ] Home learning flow replacing parallel AI/teacher/parent cards.
- [ ] Login/register path that supports next-route handoff.
- [ ] Multi-step registration for student, parent, and tutor.
- [ ] Tutor credential upload UI and mock upload API.
- [ ] Chat empty state and AI-response inline teacher escalation.
- [ ] Demo backend support for expanded register and credential upload.

### Add After Validation

- [ ] Richer onboarding persistence across browser reloads.
- [ ] Real invitation email flow for parent linking.
- [ ] Real tutor credential review dashboard.
- [ ] Motion library if Phase 16 visual QA proves CSS motion insufficient.

## Sources

- Appcues onboarding guide, 2026-05-19: activation depends on guiding new users to meaningful value, not front-loading features.
- Openfield EdTech instructor onboarding article: instructors are learners too; onboarding should reduce complexity and use progressive scaffolding.
- Tavi AI education product page: parent visibility and constrained AI tutoring are best framed around one clear product promise.
- arXiv 2605.11155: hybrid human-AI tutoring supports human tutor involvement as differentiated support, not just a separate feature bucket.

---
*Feature research for: STOA Phase 15*
*Researched: 2026-05-25*
