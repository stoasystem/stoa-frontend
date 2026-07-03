# Home V2 Image And Asset Strategy

**Date:** 2026-07-03
**Status:** Draft for v2.8
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

## Source Notes

### Pexels

Use as the first free source for candidate discovery.

Current policy notes:

- Free to use for photos and videos.
- Attribution is not required, but internal metadata should still record source and creator when available.
- Do not imply endorsement by people or brands in imagery.
- Do not portray identifiable people in negative or offensive ways.
- Do not resell unaltered content, redistribute on stock platforms, or use assets as trademarks.

### iStock

Use as a paid, approval-gated source when free stock cannot meet the required quality.

Current policy notes:

- iStock offers standard and extended licenses.
- Watermarked content is for comp/testing only and must not appear in final public materials.
- Paid assets require approval before purchase and final use.
- AI Generator content is a separate path and should not be treated as normal stock photography.

### Magnific

Use primarily for stock discovery, asset enhancement research, or future workflow support, not as the default generator.

Current policy notes:

- Magnific combines stock assets with AI creative tools.
- It advertises licensed stock content and AI generation/editing/upscaling tools.
- For STOA Home V2, prefer stock assets and record any AI enhancement explicitly.
- Avoid AI-generated family/child hero imagery unless separately approved.

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

## Crop And Optimization Expectations

Future implementation should prepare:

- Hero desktop crop: wide editorial frame, approximately 4:3 or 5:4 inside double-bezel.
- Hero mobile crop: portrait-safe or square-safe crop with faces/hands/materials preserved.
- Learning Thread proof crops: stable card/frame ratios, not full-bleed.
- Trust layer crops: small detail or environment frames.
- Use modern optimized formats where project tooling supports them.
- Keep original source metadata in docs even if local files are converted.

## Approval Gates

Approval is required before:

- Purchasing paid stock.
- Using identifiable children or families in the Hero.
- Using AI-generated or AI-enhanced people imagery.
- Using any asset with brand logos, school marks, uniforms, or recognizable private property.
- Committing final binary assets.
- Replacing current `/`.

## v2.8 Done Means

- Source policy is documented.
- Licensing and risk checks are documented.
- Section asset briefs and search taxonomy are documented.
- Metadata, storage, crop, and optimization strategy are documented.
- Later implementation can acquire and insert assets without reopening the visual direction milestone.

It does not mean final assets are downloaded, purchased, committed, or visible in the app.
