# Locale-Specific Copy Rules

Phase 17 treats English, German, French, and Italian as local product copy, not literal translations of one source sentence.

## Core Principle

The copy may change structure by locale when that produces a clearer, more natural, and more stable UI.

Every locale must preserve:

- the same product meaning
- the same calm STOA education tone
- the same premium, trustworthy brand posture
- the same user task and CTA intent
- stable layout at common mobile, tablet, desktop, and wide desktop widths

## Translation Is Not Enough

Avoid translating English word for word when it creates:

- long hero titles
- awkward sentence rhythm
- cramped buttons
- card titles that wrap poorly
- pricing or billing copy that feels aggressive
- parent copy that creates anxiety
- tutor copy that implies teachers are backup systems

Prefer writing each locale as if it were the original product copy.

## Hero Title Rules

Hero titles should be short, memorable, and easy to set in large display type. They should not explain the whole product.

Recommended limits:

| Locale | Recommended hero title length |
| --- | --- |
| English | 3-7 words |
| German | 2-5 words, or stacked short title lines |
| French | 3-7 words |
| Italian | 3-7 words |

Move explanatory detail into the subtitle or section body.

## Approved Phase 17 Hero Direction

| Locale | Title | Primary CTA | Secondary CTA |
| --- | --- | --- | --- |
| English | Learn with clarity. | Start learning | How it works |
| German | Lernen. Fragen. Verstehen. | Lernen starten | So funktioniert STOA |
| French | Comprendre avec confiance. | Commencer à apprendre | Comment ça fonctionne |
| Italian | Studiare con più chiarezza. | Inizia a studiare | Come funziona |

German may use explicit `titleLines` instead of one title string:

```json
{
  "titleLines": ["Lernen.", "Fragen.", "Verstehen."]
}
```

English, French, and Italian may keep a single `title` string when it fits the UI.

## CTA Rules

CTAs should be direct and user-centered.

Prefer:

- Start learning
- Ask a teacher
- Choose a plan
- View report
- Continue

Avoid:

- Buy now
- What we are selling
- AI support
- Teacher backup
- Human backup
- Platform entry language that feels technical or bureaucratic

## Page-Level Rules

Homepage:
Use short titles, clear subtitles, and education-value language. Do not make the hero title carry every product detail.

Register:
Role-selection and form labels should be concise. Tutor credential copy should sound professional without implying production verification.

Chat:
Use `Learning Assistant` language. Teacher escalation should read as professional support, not backup.

Parent report:
Use calm, supportive language. Avoid anxiety framing such as implying a child is behind or failing.

Tutor workflow:
Use professional language. Teachers help with context and judgment; they are not fallback machinery.

Pricing and billing:
Use family value and plan choice language. Avoid aggressive purchase language and developer-facing quota explanations.

Support and errors:
Keep messages concise, human, and non-technical unless the user needs exact next steps.

## Scope Boundaries

Phase 17 includes:

- locale copy rules
- revised EN/DE/FR/IT P0 copy
- title structure support where needed
- locale layout hints
- terminology cleanup
- copy review and visual QA docs
- README updates and build verification

Phase 17 excludes:

- new languages
- new business features
- CMS/TMS tooling
- automatic translation pipelines
- backend language preference sync
- locale-prefixed SEO routing
- legal-final translations
- email template localization
- regional pricing or currency localization
- broad design-system or accessibility hardening

## Maintenance Rule

When adding or changing visible copy, check:

1. Does each locale read naturally?
2. Does the meaning remain aligned?
3. Does the copy avoid banned terminology?
4. Does the UI still fit at mobile and desktop widths?
5. Does the copy belong in locale files rather than component literals?
