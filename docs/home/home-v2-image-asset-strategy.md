# Home V2 Image And Asset Strategy

**Date:** 2026-07-03
**Status:** Final for v2.8
**Depends on:** `docs/home/home-v2-information-architecture.md`, `docs/home/home-v2-visual-direction.md`

## Purpose

This document defines how Home V2 should source, evaluate, document, and hand off imagery before final assets are downloaded, purchased, generated, optimized, or inserted into the React app.

The default direction is real licensed imagery. AI generation should be avoided unless a later approval explicitly accepts it for a narrow non-identifiable support role.

## Source Hierarchy

| Priority | Source type | Use for | Notes |
|----------|-------------|---------|-------|
| 1 | Real licensed photography from free stock sources | Candidate discovery and early visual fitting | Pexels is the first free source to evaluate. |
| 2 | Paid licensed stock | Hero or high-stakes visuals when free stock feels generic | iStock is paid and approval-gated. |
| 3 | Stock libraries inside creative platforms | Supplemental candidates and asset variants | Magnific stock can be considered, but AI tools are not the default. |
| 4 | Owned or commissioned photography | Future ideal if budget/time allows | Best long-term source for Swiss-family authenticity. |
| 5 | AI enhancement or generation | Last resort or technical enhancement only | Must be recorded in metadata and should not be default hero imagery. |

## Asset Principles

Home V2 imagery should feel observed, not manufactured.

Principles:

- Use real photography whenever possible.
- Prefer quiet learning moments over smiling-at-camera stock.
- Prioritize Swiss-parent trust over novelty.
- Keep children represented respectfully and never as a problem to be solved.
- Avoid images that make STOA look like an AI tool, generic SaaS product, or homework-solver.
- Treat paid assets, identifiable people, recognizable property, and AI-edited imagery as approval-gated.

The page should visually say:

```text
Serious learning support for families, with technology in the background.
```

It should not visually say:

```text
Generate an answer instantly with AI.
```

## Source Notes

### Pexels

Use as the first free source for candidate discovery.

Current policy notes:

- Free to use for photos and videos.
- Attribution is not required, but internal metadata should still record source and creator when available.
- Do not imply endorsement by people or brands in imagery.
- Do not portray identifiable people in negative or offensive ways.
- Do not resell unaltered content, redistribute on stock platforms, or use assets as trademarks.

Recommended use:

- First pass for Hero and Parent Confidence candidates.
- Good for mood, family learning, study material, and home-study detail shots.
- Always preserve source URL and creator name internally even when attribution is not required.

### iStock

Use as a paid, approval-gated source when free stock cannot meet the required quality.

Current policy notes:

- iStock offers standard and extended licenses.
- Watermarked content is for comp/testing only and must not appear in final public materials.
- Paid assets require approval before purchase and final use.
- AI Generator content is a separate path and should not be treated as normal stock photography.

Recommended use:

- Use when Pexels candidates feel too generic or insufficiently premium.
- Best for high-stakes Hero imagery or a specific Swiss/European education feel.
- Do not purchase before the section role, crop need, and approval status are clear.

### Magnific

Use primarily for stock discovery, asset enhancement research, or future workflow support, not as the default generator.

Current policy notes:

- Magnific combines stock assets with AI creative tools.
- It advertises licensed stock content and AI generation/editing/upscaling tools.
- For STOA Home V2, prefer stock assets and record any AI enhancement explicitly.
- Avoid AI-generated family/child hero imagery unless separately approved.

Recommended use:

- Stock discovery and future enhancement workflow research.
- Potential upscaling or format preparation after an approved real asset is selected.
- Not the default source for generated people, families, or children.

## Similar Source Criteria

Other sources may be considered only when they pass the same screen:

| Requirement | Required standard |
|-------------|-------------------|
| License clarity | Publicly documented license or purchase agreement. |
| Commercial use | Website/marketing use permitted. |
| Attribution | Requirements are clear and recordable. |
| Releases | Identifiable people/property risk can be assessed. |
| AI status | AI-generated, AI-edited, and pure stock assets can be distinguished. |
| Provenance | Source URL and creator/source identity can be preserved. |

Do not use a source if its license is vague, unavailable, or incompatible with a public commercial education website.

## Section Asset Briefs

### Hero

Need:

- Real family or home-study learning moment.
- Swiss or broadly European private-education feel.
- Parent nearby but not controlling the child.
- Warm natural light, calm interior, study table, paper, laptop, or school material.
- Crop flexibility for a double-bezel frame.

Avoid:

- Smiling-at-camera stock poses.
- Overly staged tutor-child scenes.
- Dark, blurred, decorative atmosphere.
- AI-looking faces, hands, books, or screens.
- Imagery implying guaranteed outcomes or elite exclusivity without learning substance.

### Learning Thread

Need:

- A sequence of learning evidence: stuck question, guided next step, teacher support, parent pattern.
- Can mix photography with product-evidence mock surfaces later.
- Should support vertical or diagonal narrative composition.

Avoid:

- Generic laptop-dashboard stock.
- Feature-grid metaphors.
- Chatbot or robot imagery.

### Parent Confidence

Need:

- Parent calm, visibility, and reassurance.
- Summary/pattern feeling rather than surveillance.
- Parent-child trust without parent takeover.

Avoid:

- Monitoring screens, control-room metaphors, or anxious hovering.
- Negative child portrayal.

### Swiss Trust Layer

Need:

- Subtle institutional trust: multilingual rhythm, teacher-backed support, privacy-conscious operation, Swiss family routine.
- Could use restrained environment/detail photography instead of people-heavy imagery.

Avoid:

- Generic compliance badges.
- Flags or Swiss cliches unless handled with restraint.

### Final CTA

Need:

- Quiet confidence, not a sales popup.
- May reuse a cropped detail or abstracted learning material if it supports the final CTA.

Avoid:

- New narrative imagery that competes with the Hero.

## Search Taxonomy

Initial English query families:

- `family homework at home Europe`
- `parent child studying at table`
- `student homework help home`
- `private school study Switzerland`
- `teacher helping student homework`
- `parent education support child`
- `calm study desk school materials`
- `European family learning at home`
- `teen studying parent support`
- `tutor support student learning`

German/French/Italian query variants should be used later when sources support locale search:

- German: `Familie Hausaufgaben`, `Schüler lernen zu Hause`, `Nachhilfe Lernen`
- French: `famille devoirs maison`, `élève étudie parent`, `soutien scolaire`
- Italian: `famiglia compiti casa`, `studente studia genitore`, `supporto scolastico`

Source-specific search starts:

| Source | Search start |
|--------|--------------|
| Pexels | family homework, parent child studying, student learning at home, study desk, tutor student |
| iStock | family homework Europe, private education family, parent child studying, teacher support student |
| Magnific stock | education family, study at home, tutoring, school materials, premium learning |

Do not use search terms that over-index on AI, robot, chatbot, futuristic classroom, guaranteed grades, or surveillance.

## Candidate Scoring

Each candidate should be scored from 1 to 5:

| Criterion | Meaning |
|-----------|---------|
| Authenticity | Feels real, not staged stock or AI. |
| Swiss-parent fit | Fits premium Swiss-family education context. |
| Learning relevance | Clearly supports study, questions, explanation, or progress. |
| Crop flexibility | Works in desktop double-bezel frame and mobile crop. |
| Diversity and age fit | Represents target family/student context respectfully. |
| Brand fit | Matches calm, editorial, high-end education direction. |
| Risk level | Low endorsement, release, trademark, and sensitive-context risk. |

Candidates scoring below 4 on authenticity or risk should not be used for Hero.

Suggested score interpretation:

| Score | Meaning |
|-------|---------|
| 5 | Strong candidate; likely shortlist if license is clear. |
| 4 | Usable candidate; may need crop or section-role adjustment. |
| 3 | Reference only; not final without a better justification. |
| 2 | Weak fit; keep only to explain what not to use. |
| 1 | Reject. |

Hero threshold:

- Authenticity: 4 or 5.
- Risk level: 4 or 5.
- Crop flexibility: 4 or 5.
- Brand fit: 4 or 5.

Learning Thread and Swiss Trust candidates may be more abstract or detail-oriented, but still need license clarity and low endorsement risk.

## Candidate Shortlist Process

1. Search each source using the taxonomy above.
2. Capture 5-8 candidates per major section before narrowing.
3. Record metadata before downloading or purchase.
4. Score candidates against the rubric.
5. Reject high-risk or AI-looking people imagery immediately.
6. Keep 2-3 shortlist candidates for Hero and 1-2 candidates for each supporting section.
7. Request approval before purchasing, committing, or inserting final images.

Shortlist output should be a document or table first. Final binary assets belong to a later milestone.

## Metadata Ledger

Future candidate tracking should use this format:

| Field | Required |
|-------|----------|
| Candidate ID | yes |
| Section role | yes |
| Source platform | yes |
| Source URL | yes |
| Creator/source name | when available |
| License type | yes |
| Free/paid status | yes |
| Model/property-release risk | yes |
| AI generated or AI enhanced | yes |
| Crop notes | yes |
| Candidate score | yes |
| Approval status | yes |
| Download/purchase status | yes |
| Local file path | after implementation |

Example row:

| Field | Example |
|-------|---------|
| Candidate ID | `hero-pexels-001` |
| Section role | Hero family learning |
| Source platform | Pexels |
| Source URL | `https://www.pexels.com/photo/...` |
| Creator/source name | Photographer name if available |
| License type | Pexels License |
| Free/paid status | Free |
| Model/property-release risk | Identifiable people; no endorsement language |
| AI generated or AI enhanced | No |
| Crop notes | Works 5:4 desktop, needs face-safe mobile crop |
| Candidate score | 4.4 average |
| Approval status | Candidate only |
| Download/purchase status | Not downloaded |
| Local file path | Not applicable yet |

## Future Storage Strategy

If assets are later committed locally, use a dedicated Home V2 namespace:

```text
public/img/home-v2/
```

Suggested naming pattern:

```text
home-v2-[section]-[role]-[source]-[short-id].[ext]
```

Examples:

```text
home-v2-hero-family-study-pexels-12345.webp
home-v2-thread-teacher-support-istock-67890.webp
```

Do not commit source downloads without approval and optimization.

If implementation later needs a non-public source ledger, keep the ledger in docs or planning artifacts, not embedded in component code.

## Crop And Optimization Expectations

Future implementation should prepare:

- Hero desktop crop: wide editorial frame, approximately 4:3 or 5:4 inside double-bezel.
- Hero mobile crop: portrait-safe or square-safe crop with faces/hands/materials preserved.
- Learning Thread proof crops: stable card/frame ratios, not full-bleed.
- Trust layer crops: small detail or environment frames.
- Use modern optimized formats where project tooling supports them.
- Keep original source metadata in docs even if local files are converted.

Future implementation should also define:

- `srcset`/responsive image behavior if using HTML images directly.
- Width and height attributes or stable aspect-ratio wrappers to prevent layout shift.
- Alt text at implementation time, tied to the section's communicative role.
- Image compression quality threshold after visual QA.
- Original source link and license record even after conversion to `.webp` or `.avif`.

## Approval Gates

Approval is required before:

- Purchasing paid stock.
- Using identifiable children or families in the Hero.
- Using AI-generated or AI-enhanced people imagery.
- Using any asset with brand logos, school marks, uniforms, or recognizable private property.
- Committing final binary assets.
- Replacing current `/`.

Approval table:

| Gate | Owner decision needed |
|------|-----------------------|
| Paid iStock candidate | Budget and license approval. |
| Identifiable child/family Hero image | Trust, release-risk, and endorsement-risk approval. |
| Magnific AI generation | Explicit exception approval. |
| AI enhancement of a real asset | Enhancement disclosure and quality approval. |
| Final local asset commit | File size, naming, license metadata, and QA approval. |

## Handoff Checklist

Before a later implementation milestone inserts assets:

- [ ] Candidate metadata ledger exists.
- [ ] Source URLs and license notes are recorded.
- [ ] Paid assets are approved before purchase.
- [ ] AI status is recorded.
- [ ] Hero asset has desktop and mobile crop notes.
- [ ] Identifiable-person risk is reviewed.
- [ ] Alt text intent is drafted.
- [ ] Local filename and storage path are assigned.
- [ ] Image optimization target is defined.
- [ ] Screenshot QA plan includes desktop and mobile first viewport.

## QA Readiness

Later browser QA should verify:

- Hero image is visible in first viewport and does not crop faces/hands/materials awkwardly.
- Mobile crop keeps the parent/student learning signal.
- Images do not make the page look like generic stock, AI software, or a school brochure detached from product proof.
- No image overlaps with text, CTA, or next section.
- Double-bezel frames preserve stable aspect ratio.
- Asset file sizes are reasonable after optimization.
- Alt text is meaningful without over-describing decorative details.
- Source metadata remains traceable after implementation.

## v2.8 Done Means

- Source policy is documented.
- Licensing and risk checks are documented.
- Section asset briefs and search taxonomy are documented.
- Metadata, storage, crop, and optimization strategy are documented.
- Later implementation can acquire and insert assets without reopening the visual direction milestone.

It does not mean final assets are downloaded, purchased, committed, or visible in the app.

## Phase Completion Map

| Phase | Completed contribution |
|-------|------------------------|
| 236 | Defined source hierarchy, source-specific licensing rules, risk screens, and AI-use boundaries. |
| 237 | Defined section asset briefs, search taxonomy, candidate scoring, and rejection criteria. |
| 238 | Defined metadata ledger, future storage naming, crop/optimization strategy, and shortlist process. |
| 239 | Defined handoff checklist, approval gates, QA readiness, and deferred implementation scope. |
