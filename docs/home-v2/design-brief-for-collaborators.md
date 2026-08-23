# Home V2 Design Brief

**Status:** Current implementation reference
**Primary route:** `/`
**Audience:** Collaborators working on STOA's public website, content, imagery, and product hand-off

## What This Page Is

Home V2 is STOA's parent-facing introduction to guided learning support. Its purpose is not to sell an abstract technology category or turn education into a performance contest. It makes one idea tangible: a child can begin with the question in front of them, receive proportionate guidance, and have teacher support available when it is genuinely useful. Parents gain a clear view of learning without being asked to take over the work.

The intended character is approximately **70% Swiss private-school / high-end education service** and **30% modern learning product**. It should feel composed, warm, and quietly capable. The page deliberately avoids a dense dashboard, generic AI imagery, gamified progress language, and aggressive claims.

The public homepage is primarily for parents. Student, teacher, parent, and administrative product routes remain role-specific experiences; they do not need to inherit the parent-facing marketing voice.

## Route And Source Of Truth

`src/app/router/AppRouter.tsx` currently maps `/` to `HomeV2Page`. The earlier `/home-v2` preview-route references in historical v8/v9 planning documents are no longer the runtime source of truth.

The entry composition is in `src/pages/home-v2/HomeV2Page.tsx`; it owns the page-specific SEO title and description, Home V2 footer treatment, and role-aware learning entry target.

## Page Narrative

The page follows a single learning moment rather than presenting a long list of features.

| Section | What the visitor should understand | Current implementation |
|---|---|---|
| Fixed header | STOA is calm, accessible, multilingual, and easy to enter. | `HomeV2PremiumHeader` offers Parents, Tutors, Pricing, language choice, and Login. |
| Hero | Start with a real question; support should make the next step clear. | Family-study photograph, concise headline, primary learning CTA, parent CTA, and a small learning-status note. |
| Learning Thread | Support develops in a sequence: question, hint, teacher support, clearer learning at home. | Four staggered cards on a guided rail that progressively lights as attention moves through them. |
| Parent Confidence | Parents should see what was worked on, where help was used, and what is next. | Quiet editorial image with a bounded learning-note overlay, not a surveillance dashboard. |
| Assurance by design | Support stays educational and proportionate. | Four short principles and a detail image; privacy is expressed through restraint rather than repeated slogans. |
| Final CTA | Starting should feel immediate and unforced. | Dark, spacious closing panel with one primary action and a parent path. |

## Visual Direction

### Typography

The typography uses two distinct jobs rather than one font for everything:

- **Display:** `PP Editorial New`, with `Canela`, `Cormorant Garamond`, and Georgia as fallbacks. It is reserved for hero, section, card, and CTA-panel headings.
- **Text and controls:** `Plus Jakarta Sans`, with `Geist`, `Avenir Next`, and system fallbacks. It is used for body copy, navigation, buttons, labels, numbered principles, and locale controls.

This division gives the page an editorial sense of value while keeping operational text direct and legible. Letter spacing is neutral for display type; the small all-caps labels use measured positive tracking to create a quiet signpost system.

### Colour And Material

The palette is a cool porcelain and mist-grey field, not beige or generic SaaS blue. Its semantic tokens are defined in `src/styles/home-v2-premium.css`:

- **Ink / espresso:** near-black structural colour for type, deep panels, and controls.
- **Paper / porcelain:** blue-grey white surfaces that preserve lightness without reading as cream.
- **Burgundy:** restrained editorial accent for learning status, active thread states, and selected emphasis.
- **Gold:** warmth, moments of attention, and the small live points in the thread.
- **Sage:** a quiet secondary signal for the learning process.
- **Line:** low-contrast structural edges and assurance rules.

The background is a large, non-repeating SVG line field with a light layer behind it. It is intentionally not a grid or a paper texture. Its curves guide the eye across the page and are meant to feel like a restrained current rather than decorative noise.

### Layout

The page uses wide editorial fields with a `max-w-7xl` content container and deliberately asymmetric desktop grids. Images are framed rather than allowed to fill the viewport edge to edge. Rounded visual frames, inner rims, low-contrast rules, and soft shadows create depth without accumulating card-on-card surfaces.

On mobile, the header collapses to a single clear menu control. The Hero image is constrained to a portrait frame with a fixed minimum height; it is not allowed to become a full-screen photograph. Text blocks and actions stack in reading order.

## Motion And Interaction

Motion is there to show attention and continuity, never to advertise itself.

- The background's watermark and light field drift with scroll where CSS scroll timelines are supported. The movement is transform-only and follows a gentle, curved path.
- The Learning Thread uses `IntersectionObserver` to identify the card nearest the reading anchor. The rail fills progressively, the current node receives a restrained breathing halo, and the active card lifts slightly.
- The Parent Confidence note, Trust caption, and final panel use slow ambient light breathing. These are not scanning effects.
- Navigation, buttons, and cards use quiet colour, shadow, and transform transitions. Active button feedback is limited to a small press scale.
- `prefers-reduced-motion: reduce` removes animation and transitions while retaining all essential content and state.

## Image Direction And Current Assets

The visual language should rely on real, warm, editorial photography for people. Faces should suit the Swiss-market context and should not read as a generic international stock montage. AI-generated material is acceptable only for abstract light, texture, or non-identifiable study details; it is not the default for person-led hero photography.

Current runtime files are deliberately contained in the Home V2 preview asset directory:

| Area | File | Current role |
|---|---|---|
| Hero | `img/home-v2/preview/hero-family-study-table-preview.jpg` | Parent-facing study moment inside a framed Hero image. |
| Parent Confidence | `img/home-v2/preview/father-son-laptop-preview.jpg` | Warm parent-child learning context with an explanatory note overlay. |
| Assurance | `img/home-v2/preview/study-desk-writing-preview.jpg` | Detail-led study image, used as supporting atmosphere rather than a claim. |

These images are preview/planning assets. A final public marketing decision still needs provenance and licence confirmation or commissioned replacements.

## Copy Principles

- Speak with confidence and understatement. Describe the learning moment; do not praise the product at length.
- Prefer concrete language such as "Start with the question" and "A clearer view of learning" over vague performance language.
- Teacher-backed support is a core differentiator and should remain visible, but it should not turn into repeated feature copy.
- Parent visibility is about clarity: what was practised, where support helped, and what comes next. It is not a live feed or a request for parental control.
- Privacy and respect are shown through the composition, limited data language, and a non-surveillance posture. Do not turn every section into a privacy claim.
- Do not lead with AI terminology. The product is positioned as guided learning support.

All Home V2 strings are kept in the `homeV2` i18n namespace. English is the source copy; German, French, and Italian are supported at runtime. Romansh is acknowledged as a Swiss-language consideration but is not currently implemented.

## Implementation Map

| Concern | Source location |
|---|---|
| Page composition and SEO | `src/pages/home-v2/HomeV2Page.tsx` |
| Root route | `src/app/router/AppRouter.tsx` |
| Header, navigation, login, language controls | `src/components/home-v2/HomeV2PremiumHeader.tsx` |
| Hero and entry CTAs | `src/components/home-v2/HomeV2Hero.tsx` |
| Progressive learning narrative | `src/components/home-v2/HomeV2LearningThread.tsx` |
| Parent clarity | `src/components/home-v2/HomeV2ParentConfidence.tsx` |
| Assurance principles | `src/components/home-v2/HomeV2TrustLayer.tsx` |
| Closing action | `src/components/home-v2/HomeV2FinalCta.tsx` |
| Shared CTA, reveal, and image-frame behaviour | `src/components/home-v2/HomeV2Cta.tsx`, `HomeV2Reveal.tsx`, `HomeV2VisualFrame.tsx` |
| Typography, palette, responsive layout, and motion | `src/styles/home-v2-premium.css` |
| English copy | `src/i18n/locales/en/homeV2.json` |
| Locale list and persisted language selection | `src/i18n/languages.ts` |

## Collaboration Guardrails

When extending Home V2, preserve the hierarchy before adding anything new.

1. Add content only when it strengthens the learning narrative. Do not turn the page into a product feature catalogue.
2. Reuse the shared visual frame, CTA, and Home V2 tokens instead of introducing a separate local style.
3. Keep people-led imagery real and traceable. Do not commit unlicensed previews or watermarked material.
4. Keep any new motion slow, transform-based, and optional under reduced-motion settings.
5. Test copy at all four existing locales. Long German, French, and Italian strings must not create horizontal overflow or arbitrary word breaks.
6. Treat legal, asset provenance, canonical URL, sitemap, and rollback work as launch concerns. This design brief is not legal approval or a launch sign-off.

## Current Follow-Up Items

- Confirm final public licensing or commission replacements for the Hero and Parent Confidence photography.
- Obtain qualified legal review before relying on the privacy and terms pages publicly.
- Reconcile historical v8/v9 route documents with the current `/` runtime mapping during the next documentation or release pass.
- Define canonical URL, sitemap, language-alternate, monitoring, and rollback decisions for the actual public deployment path.
