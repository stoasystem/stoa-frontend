# Roadmap: STOA Frontend

## Milestones

- ✅ **v2.4 UI Copy & Web Design Refinement** - Phases 219-224 (shipped 2026-06-02)
- ✅ **v2.5 Online Classroom Focused Redesign** - Phases 225-227 (shipped 2026-06-02)
- ✅ **v2.6 Home V2 Positioning and Information Architecture** - Phases 228-231 (shipped 2026-07-03)

## Phases

- [x] **Phase 228: Home V2 Positioning Contract** - Lock the audience, promise, tone, CTA direction, and anti-positioning rules for the separate Home V2 homepage.
- [x] **Phase 229: Current Homepage Inventory and New Section Map** - Audit the current homepage and convert its feature-heavy structure into a shorter Swiss-parent learning-thread IA.
- [x] **Phase 230: Route, Namespace, Navigation, and CTA Journey** - Define the preview route, component/i18n namespaces, public navigation impact, and registration/login handoff.
- [x] **Phase 231: Localization Guardrails and IA Handoff Closure** - Document multilingual IA risks, German layout constraints, and implementation handoff requirements for later design/build milestones.

## Phase Details

### Phase 228: Home V2 Positioning Contract

**Goal**: The redesign has one primary audience, one public promise, one primary CTA direction, and a clear list of what the homepage must not become.
**Depends on**: Phase 227
**Requirements**: HVIA-01, HVIA-02, HVIA-03, HVIA-04
**Success Criteria**:
  1. Swiss parents are documented as the homepage's first audience.
  2. Student, tutor, parent, and admin app pages remain role-specific and are not forced into the homepage audience.
  3. The positioning avoids AI-tool, homework-solver, and generic SaaS language.
  4. The CTA direction uses natural learning language such as `Start learning`.
  5. The 70/30 premium education/product split is usable as a decision filter.
**Plans**: 228-PLAN.md
**UI hint**: yes

### Phase 229: Current Homepage Inventory and New Section Map

**Goal**: The current homepage is fully accounted for, and Home V2 has a concise section order that tells one coherent parent-facing learning story.
**Depends on**: Phase 228
**Requirements**: HVIA-05, HVIA-06, HVIA-07, HVIA-08
**Success Criteria**:
  1. Each current homepage section has a keep, merge, demote, delete, or rewrite disposition.
  2. The new page structure is shorter than the current homepage and avoids equal-weight feature-card overload.
  3. Practice, Learning Assistant, teacher support, and parent visibility are mapped as one learning thread.
  4. The IA document names the copy/product claims that Home V2 must avoid.
  5. The section map is concrete enough for visual and copy milestones to start without re-litigating structure.
**Plans**: 229-PLAN.md
**UI hint**: yes

### Phase 230: Route, Namespace, Navigation, and CTA Journey

**Goal**: Home V2 can be built separately from the current homepage with a documented route, namespace, navigation policy, and CTA-to-registration journey.
**Depends on**: Phase 229
**Requirements**: HVIA-09, HVIA-10, HVIA-11, HVIA-12
**Success Criteria**:
  1. The current `/` route remains unchanged during the Home V2 preview period.
  2. A preview route, component namespace, and translation namespace are documented.
  3. The `Start learning` journey through login/register and trial quota semantics is mapped.
  4. Public navigation remains uncluttered and does not turn Practice into a generic marketing nav island.
  5. Route and namespace decisions are ready for a later implementation milestone.
**Plans**: 230-PLAN.md
**UI hint**: no

### Phase 231: Localization Guardrails and IA Handoff Closure

**Goal**: The IA is ready for visual design, image work, animation, copywriting, localization, implementation, and QA without hidden ambiguity.
**Depends on**: Phase 230
**Requirements**: HVIA-13, HVIA-14, HVIA-15, HVIA-16
**Success Criteria**:
  1. English, German, French, and Italian IA risks are documented before final copywriting.
  2. German long-title and CTA constraints are identified before hero design.
  3. Later milestones know which artifacts to produce for visual direction, images, animation, copy, localization, build, and QA.
  4. The final IA document is self-contained and linked from GSD planning state.
  5. `git diff --check` passes for documentation changes.
**Plans**: 231-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 228. Home V2 Positioning Contract | 1/1 | Complete | 2026-07-03 |
| 229. Current Homepage Inventory and New Section Map | 1/1 | Complete | 2026-07-03 |
| 230. Route, Namespace, Navigation, and CTA Journey | 1/1 | Complete | 2026-07-03 |
| 231. Localization Guardrails and IA Handoff Closure | 1/1 | Complete | 2026-07-03 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 228 | 4 | HVIA-01, HVIA-02, HVIA-03, HVIA-04 |
| 229 | 4 | HVIA-05, HVIA-06, HVIA-07, HVIA-08 |
| 230 | 4 | HVIA-09, HVIA-10, HVIA-11, HVIA-12 |
| 231 | 4 | HVIA-13, HVIA-14, HVIA-15, HVIA-16 |

**Total requirements:** 16
**Mapped requirements:** 16
**Unmapped requirements:** 0

## Next Up

No pending phase. Milestone v2.6 is complete.
