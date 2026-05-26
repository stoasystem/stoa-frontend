# Phase 20 Research: Features

**Milestone:** v1.19 Phase 20
**Focus:** Cross-locale copy quality, German style alignment, and multilingual layout adaptation.

## Table Stakes

### German Style Study

- Document read-only source path and source safety status.
- Extract German headline rhythm, CTA style, sentence length, tone, education terms, and formal/informal address patterns from `/Users/zhdeng/newweb`.
- Convert observations into STOA learning-platform rules, not copied source text.

Observed company homepage style signals:

- Short editorial hero lines: `Tief denken. Wahrhaft lernen.`
- Navigation and CTAs are short: `Angebot`, `Kontakt`, `Mehr erfahren`, `Jetzt anmelden`, `Kontakt aufnehmen`.
- Tone is calm, formal, and education-service oriented.
- German frequently uses `Schülerinnen und Schüler` in formal explanatory text, but shorter UI labels use `Lernende`, `Kinder`, `Jugendliche`, or role terms.
- Education terms include `Lernfortschritt`, `Verständnis`, `Sicherheit`, `Selbstvertrauen`, `Begleitung`, `Unterstützung`, `Lehrpersonen`, `Lernumgebung`, `Förderung`.
- `Nachhilfe` appears where service category clarity matters, but premium brand sections often prefer broader education wording such as `Förderung`, `Begleitung`, `Lernunterstützung`, and `Lernumgebung`.

### Cross-Locale Copy Rules

- English remains calm, precise, education-oriented, and non-salesy.
- German becomes less direct-translation-like and more aligned with STOA homepage tone.
- French remains elegant and natural, with correct typographic apostrophes.
- Italian remains warm, clear, and button-friendly.
- Literal match is not required; meaning and tone alignment are required.

### Core Page Copy Refinement

P0 surfaces:

- Homepage.
- Register/onboarding.
- Chat.
- Parent report.
- Pricing.
- Billing.
- Support.

P1 surfaces:

- Tutor dashboard/request surfaces.
- Admin labels where user-facing.
- Learning history/profile routes where locale files or visible copy apply.

### Locale Layout Adaptation

- German long words and long compounds need shorter copy first, then layout support.
- French apostrophes such as `d’apprentissage`, `l’élève`, and `qu’un` need JSON-safe and rendering-safe handling.
- Italian CTA strings need width/wrapping support.
- Mobile/desktop visual QA must include key routes, four locales, and target widths.

## Differentiators

- Use main website German as a brand-language reference while preserving the learning platform's app identity.
- Treat language and layout as one system: copy changes must be checked in the UI.
- Keep the Phase 19 brand visuals stable while improving the text layer.

## Anti-Features

- Do not force literal translation.
- Do not copy long homepage text into the app.
- Do not create language-specific business logic.
- Do not introduce feature expansion under the cover of copy refinement.
- Do not expose `AI`, provider, demo, mock, or development terms in user-facing copy.

