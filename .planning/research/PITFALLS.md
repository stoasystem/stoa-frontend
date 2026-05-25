# Pitfalls Research

**Domain:** STOA Phase 15 homepage, onboarding, and AI-first learning UI
**Researched:** 2026-05-25
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Recreating the Three-Module Confusion

**What goes wrong:** The redesigned homepage still gives AI, teachers, and parents equal visual weight.
**Why it happens:** Feature lists are easier to build than product narratives.
**How to avoid:** Make the homepage story a sequence: student asks, AI responds, teacher helps if needed, parent follows progress.
**Warning signs:** Multiple hero buttons for role demos; large equal cards named after internal capabilities.
**Phase to address:** Homepage redesign.

### Pitfall 2: Onboarding Collects Data Before Delivering Value

**What goes wrong:** Registration asks many questions but does not connect users to chat quickly.
**Why it happens:** Profile completeness is treated as more important than first learning value.
**How to avoid:** Keep the wizard short, show progress, and redirect students to `/chat` with a welcome prompt.
**Warning signs:** Long single-page forms; no visible next step after registration.
**Phase to address:** Onboarding flow.

### Pitfall 3: Demo Credential Upload Looks Like Real Approval

**What goes wrong:** Tutor upload UI implies credentials are verified.
**Why it happens:** Trust UI often overstates demo capability.
**How to avoid:** Use `pending_review` language and clearly avoid "verified" after mock upload.
**Warning signs:** "Approved tutor" badges after upload; no pending status.
**Phase to address:** Tutor onboarding and demo backend support.

### Pitfall 4: Premium UI Becomes Decorative Instead of Functional

**What goes wrong:** Magazine visuals slow the page or distract from the student CTA.
**Why it happens:** Image-heavy landing pages over-prioritize atmosphere.
**How to avoid:** Use one image-led hero with informational UI preview, responsive constraints, and meaningful alt text.
**Warning signs:** Hero image consumes mobile viewport without showing CTA; decorative assets dominate real content.
**Phase to address:** Homepage redesign and visual QA.

### Pitfall 5: Teacher Escalation Becomes Another Entry Point

**What goes wrong:** Teacher request remains a standalone card/button outside the AI answer context.
**Why it happens:** Existing UI patterns are reused without changing product hierarchy.
**How to avoid:** Render teacher escalation below assistant messages and near the input as a secondary action.
**Warning signs:** Homepage "Teacher Backup" card; chat landing requires choosing support type.
**Phase to address:** Chat refinement.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-coded mock register data in components | Fast demo | Blocks real backend migration | Never; use service contract. |
| File upload logic inside wizard step | Fewer files | Hard to test/reuse | Avoid; use files service/hook. |
| Large global theme rewrite | Broad visual consistency | High regression risk | Defer to Phase 16. |
| Heavy animation dependency | Quick animation | Dependency and performance cost | Only after CSS proves insufficient. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Admin/tutor/parent CTAs compete with student CTA | Students do not know where to start. | One primary `Start Learning` CTA. |
| Registration role choices use internal names | Users hesitate. | Use plain labels and descriptions: Student, Parent, Tutor. |
| Chat empty state feels like a dashboard | Students wait instead of asking. | Direct homework input with onboarding welcome copy. |
| Parent visibility appears as surveillance | Families may distrust the product. | Frame as progress visibility and learning support. |

## "Looks Done But Isn't" Checklist

- [ ] **Homepage:** Verify mobile first viewport shows brand, CTA, and a hint of next section.
- [ ] **Onboarding:** Verify each role can complete registration and route correctly.
- [ ] **Tutor upload:** Verify PDF/PNG/JPEG and 10 MB limit UI behavior.
- [ ] **Chat:** Verify assistant response shows teacher request action.
- [ ] **Demo backend:** Verify reset still restores fixed demo accounts and new mock flows work.

## Sources

- Appcues onboarding guide, 2026-05-19: onboarding fails when teams front-load features instead of guiding users to value.
- Nielsen Norman Group mobile image guidance, 2023-11-08: decorative mobile images slow pages and should be used only when informative.
- Openfield EdTech instructor onboarding article: education onboarding should reduce complexity and scaffold progressively.
- Tavi AI education product page: parent visibility and bounded AI help should be expressed as part of one product promise.

---
*Pitfalls research for: STOA Phase 15*
*Researched: 2026-05-25*
