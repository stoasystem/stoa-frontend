# Feature Landscape

**Domain:** Locale-specific product copywriting, responsive typography, and multilingual UI refinement  
**Project:** STOA Frontend  
**Researched:** 2026-05-25  
**Overall confidence:** HIGH from `.planning/PROJECT.md`, existing Phase 16 language docs, locale JSON files, and P0 page/component inventory.

## Executive Framing

Phase 17 should treat English, German, French, and Italian as local product copy, not literal translations. Phase 16 already delivered language infrastructure, locale files, switching, glossary, terminology replacement, and a baseline QA checklist. The Phase 17 value is making the existing multilingual UI read naturally and stay visually stable across P0 surfaces without adding product functionality.

The forcing issue is the German homepage hero title: `STOA Lernunterstützung genau dann, wenn Schüler sie brauchen.` is too long for the current large serif display treatment. The milestone should introduce explicit support for locale-specific title structures, including `titleLines`, and move long explanatory meaning into subtitles/body copy. The brief's preferred homepage hero direction should become the anchor copy set: English `Learn with clarity.`, German `Lernen. Fragen. Verstehen.`, French `Comprendre avec confiance.`, Italian `Studiare con più chiarezza.`

## P0 Surface Inventory

These are the surfaces Phase 17 should treat as required copy/layout QA targets:

| Surface | Routes / Components | Locale Namespace | Phase 17 Focus |
| --- | --- | --- | --- |
| Homepage | `/`, `src/components/home/*` | `home` | Hero rewrite, title line handling, core section rewrites, German/French/Italian fit |
| Register / onboarding | `/register`, `src/components/auth/Register*` | `auth`, `common`, `errors` | Natural role-selection and form copy, mixed student/parent/tutor tone |
| Chat | `/chat`, `src/components/chat/*` | `chat`, `common`, `errors` | Student-friendly prompts, teacher escalation wording, compact states |
| Pricing | `/pricing`, `src/components/pricing/*`, billing plan cards | `pricing`, `billing` | Family-value copy, no sales-heavy or quota-enforcement language |
| Parent report | `/parent`, `/parent/children/:childId/report`, parent report cards | `parent`, `common` | Parent-readable progress language, no operational jargon |
| Tutor workflow | `/tutor`, `/tutor/requests/:requestId` | `tutor`, `common` | Professional support language, no "backup" framing |
| Billing | `/billing`, virtual checkout result pages | `billing`, `pricing` | Demo/hosted checkout explanation in customer-safe language |
| Support | `/support`, ticket forms/lists | `support`, `common`, `errors` | Localized support paths, hardcoded support sections, terminology cleanup |

## Table Stakes

Features users and maintainers should expect from this milestone. Missing items mean Phase 17 has not solved the brief.

| Feature / Work Category | Why Expected | Complexity | Likely Requirement IDs | Notes |
| --- | --- | --- | --- | --- |
| Locale copy rules overview | Phase 17 must define when locales may diverge structurally while preserving meaning, tone, and brand. | Low | LCOPY-01 | Create `docs/language/locale-copy-rules.md`; make it the umbrella policy for EN/DE/FR/IT. |
| German copy rules | German long compounds and formal/informal register create the highest layout risk. | Low | LCOPY-02 | Required coverage: long compounds, sentence length, CTA tone, punctuation, button/card fit, hero title strategy. |
| French copy rules | French needs elegant, clear phrasing without literal English structure. | Low | LCOPY-03 | Required coverage: sentence rhythm, CTA tone, apostrophes, punctuation spacing, title compactness. |
| Italian copy rules | Italian should read warm and natural without becoming verbose in buttons/cards. | Low | LCOPY-04 | Required coverage: natural warmth, sentence length, CTA directness, mobile fit. |
| English reference-copy refresh | English remains the source of product intent, but it should be calm, premium, and education-centered. | Medium | LCOPY-05 | Rewrite English P0 copy before adapting other locales where current source phrasing is too long or too technical. |
| Homepage hero rewrite | The brief explicitly calls out homepage hero title/subtitle/CTA rewrite in all four languages. | Medium | P0COPY-01, LAYOUT-01 | Use the preferred four-language hero direction; shift explanatory copy to subtitle/body. |
| `titleLines` locale support | Some locales need stacked title structures rather than one string. | Medium | LAYOUT-02 | Add support where large display titles render, starting with home hero. Do not force every title into the same line count. |
| `localeLayout.ts` hints | Components need a typed, maintainable place for locale-specific typography/layout hints. | Medium | LAYOUT-03 | Should cover hero titles, buttons, cards, navbar labels, pricing cards, and long text handling. Keep hints small and explicit. |
| Responsive typography for long locale copy | German, French, and Italian text must wrap cleanly without overflow, truncating important text, or crowding controls. | Medium | LAYOUT-04 | Review `PageHeader`, homepage section headings, CTA rows, pricing cards, support badges, chat controls, and auth forms. |
| P0 copy rewrites by namespace | Translation correctness is insufficient; each locale needs natural product copy on P0 pages. | High | P0COPY-02 through P0COPY-09 | Rewrite `home`, `auth`, `chat`, `pricing`, `billing`, `parent`, `tutor`, `support`, and relevant `common/errors` keys. |
| Terminology cleanup pass | Phase 16 removed many terms, but Phase 17 must prevent regressions and clean customer-facing wording. | Medium | TERM-17-01 | Remove user-visible `AI`, `Human backup`, `Teacher backup`, `What we are selling`, `Buy now`, `Customers`, and inappropriate sales/customer language. |
| Copy review matrix | Roadmap needs page-by-locale traceability, not just ad hoc edits. | Low | QA-COPY-01 | Create `docs/language/copy-review-matrix.md` with P0 surfaces, locale status, reviewer notes, and unresolved fit issues. |
| Visual QA by locale | The milestone is partly layout QA, so artifacted screenshots/checklists are required. | Medium | QA-LOCALE-01 | Create `docs/language/visual-qa-by-locale.md` covering desktop/mobile checks for EN/DE/FR/IT. |
| Translation QA checklist update | Phase 16 checklist is baseline; Phase 17 needs natural-copy and responsive-typography checks. | Low | QA-LOCALE-02 | Extend `docs/language/translation-qa-checklist.md` rather than replacing it. |
| Glossary and style guide updates | New locale-specific rules should feed back into the existing language system. | Low | DOCS-17-01 | Update `docs/language/glossary.md` and `docs/language/copy-style-guide.md` for Phase 17 decisions. |
| README update | The repo handoff should explain how to maintain locale-specific copy and run checks. | Low | DOCS-17-02 | Add Phase 17 docs, copy QA commands, and where `localeLayout.ts` lives. |
| Build/lint verification | The milestone changes JSON, TS, and components; standard checks must pass. | Low | QA-17-01 | Run `npm run lint` and `npm run build`; include terminology grep. |

## Must-Have Deliverables

These should be treated as required acceptance artifacts.

| Deliverable | Type | Must Include | Owner Surface |
| --- | --- | --- | --- |
| `docs/language/locale-copy-rules.md` | Documentation | Shared copy principles, locale divergence rules, tone preservation, title/subtitle division, banned literal-translation patterns | All locales |
| German copy rules | Documentation section or file | Short headline guidance, compound-word handling, formal/informal pronoun guidance, CTA/button length rules, punctuation, mobile fit | DE |
| French copy rules | Documentation section or file | Natural French sentence structure, clear CTA tone, punctuation/apostrophe considerations, title compactness | FR |
| Italian copy rules | Documentation section or file | Warm but concise tone, CTA directness, sentence length, card/button fit | IT |
| `docs/language/copy-review-matrix.md` | QA matrix | P0 surface x locale table, copy quality status, terminology status, layout status, reviewer notes | P0 pages |
| `docs/language/visual-qa-by-locale.md` | QA artifact | Viewport matrix, route list, expected pass/fail checks, unresolved screenshots or notes | P0 pages |
| `src/i18n/localeLayout.ts` | Typed layout helper | Locale-specific title/button/card hints with narrow scope and no business logic | Shared UI |
| `titleLines` support | Locale schema and components | Large titles can render arrays of intentional lines, especially homepage hero | Home hero first |
| P0 locale JSON rewrites | Locale data | Natural EN/DE/FR/IT copy for home, auth/register, chat, pricing, billing, parent, tutor, support, common/error states | Locale files |
| Terminology cleanup | Source and docs | No banned user-visible terms in `src/pages`, `src/components`, `src/i18n`; docs record exceptions for internal identifiers | User-facing source |
| README updates | Documentation | Phase 17 copy system, QA artifacts, commands, and maintenance notes | Developer handoff |

## Differentiators

Valuable enhancements that make the milestone stronger but should not distract from the must-haves.

| Feature | Value Proposition | Complexity | Notes |
| --- | --- | --- | --- |
| Page-level locale fit notes in review matrix | Makes future copy changes safer because known risky UI areas are documented. | Low | Add notes like "German CTA wraps on 375px; acceptable" or "French title requires shorter subtitle". |
| Typed helper for rendering localized title structures | Keeps title array rendering consistent across hero, page headers, and future marketing pages. | Medium | Prefer a small utility/component over copy-pasting `Array.isArray` checks. |
| Locale-aware screenshot checklist commands | Makes QA repeatable without introducing a full visual regression platform. | Medium | Use Playwright/manual route list first; full screenshot diffing can stay future work. |
| Copy lint grep bundle | Prevents banned terminology from returning. | Low | Keep as documented commands unless the team wants a formal script. |
| P1 warning list | Helps roadmap decide whether profile/history/referrals/admin need later copy work. | Low | Do not expand Phase 17 to P1 rewrites unless P0 is done. |

## Anti-Features

Explicitly do not build these in Phase 17.

| Anti-Feature | Why Avoid | What to Do Instead |
| --- | --- | --- |
| New business functionality | The brief says Phase 17 does not expand business features. | Keep changes to copy, layout hints, docs, QA, and small rendering support. |
| New languages | EN/DE/FR/IT are the Phase 16/17 language set. | Improve quality in the existing four locales. |
| Translation CMS/TMS | Too much process and infrastructure for current JSON-based product copy. | Keep reviewed local namespace JSON files. |
| Automatic machine translation pipeline | The milestone is about natural local copy, not automated translation. | Human-authored copy rules and review matrix. |
| Locale-prefixed routing or SEO localization | Not needed for P0 product usability and could create routing scope. | Keep language switcher and localStorage behavior from Phase 16. |
| Backend language preference sync | Cross-device preference persistence is backend-owned future work. | Continue using `stoa_language` in localStorage. |
| Full legal-document translation/final legal review | Legal language needs professional/legal review and is outside the copy refinement brief. | Do not present privacy/terms translations as final legal text. |
| Email-template localization | No frontend email-template system is in scope. | Leave for future backend/notifications milestone. |
| Regional pricing/currency localization | Phase 17 is copy and layout, not commercial mechanics. | Keep current pricing model; improve wording only. |
| Broad design-system/a11y rebuild | Too large for this milestone. | Add only targeted responsive typography and locale fit support. |
| Truncating essential copy to hide layout issues | Truncation can remove instructions and harm comprehension. | Shorten local copy, allow wrapping, use `titleLines`, and adjust layout hints. |
| Replacing terminology with technology hype | Conflicts with STOA's education-centered positioning. | Use Learning Assistant and professional teacher support language. |

## Likely Requirement Categories

Suggested requirement IDs for roadmap creation:

### Locale Copy Governance

- **LCOPY-01:** Developers can consult `docs/language/locale-copy-rules.md` for shared EN/DE/FR/IT copy adaptation rules.
- **LCOPY-02:** German copy rules cover long compounds, sentence length, CTA tone, punctuation, and UI fit.
- **LCOPY-03:** French copy rules cover natural phrasing, CTA tone, punctuation, sentence rhythm, and UI fit.
- **LCOPY-04:** Italian copy rules cover natural warmth, CTA directness, sentence length, punctuation, and UI fit.
- **LCOPY-05:** English P0 source copy is refreshed to be calm, premium, and education-centered before locale adaptation.

### P0 Copy Rewrite

- **P0COPY-01:** Homepage hero title, subtitle, CTAs, bullets, and core sections are rewritten in EN/DE/FR/IT.
- **P0COPY-02:** Register and role onboarding copy reads naturally in EN/DE/FR/IT and handles student/parent/tutor tone separately.
- **P0COPY-03:** Chat empty/loading/input/teacher-escalation copy is natural, student-friendly, and compact in EN/DE/FR/IT.
- **P0COPY-04:** Pricing copy explains family value and plan choice without sales-heavy or developer-facing language.
- **P0COPY-05:** Billing/checkout copy explains demo/hosted checkout safely without card/payment-secret or frontend-enforcement language.
- **P0COPY-06:** Parent dashboard/report copy explains learning progress, weak topics, and next actions in parent-friendly language.
- **P0COPY-07:** Tutor workflow copy frames teachers as professional support, not backup machinery.
- **P0COPY-08:** Support page copy, badges, info sections, request form, and ticket states are localized and terminology-compliant.
- **P0COPY-09:** Common actions, errors, labels, badges, and toast/empty/loading states used by P0 flows are reviewed for natural locale fit.

### Responsive Typography and Layout

- **LAYOUT-01:** German homepage hero no longer uses a long translated sentence in large display typography.
- **LAYOUT-02:** Large localized titles support `titleLines` arrays where intentional stacked title lines improve fit.
- **LAYOUT-03:** `src/i18n/localeLayout.ts` provides typed locale-specific layout hints for high-risk text surfaces.
- **LAYOUT-04:** P0 desktop/mobile layouts wrap long German, French, and Italian text cleanly without hiding essential text.
- **LAYOUT-05:** Buttons, badges, nav labels, pricing cards, support cards, and chat actions remain usable at mobile widths.

### Terminology

- **TERM-17-01:** User-facing source no longer contains banned terms: `AI`, `Human backup`, `Teacher backup`, `What we are selling`, `Buy now`, `Customers`, or equivalent inappropriate sales/customer phrasing.
- **TERM-17-02:** Glossary and copy style guide document Phase 17 refinements and permitted internal technical exceptions.

### QA and Documentation

- **QA-COPY-01:** `docs/language/copy-review-matrix.md` records copy, terminology, and layout status for each P0 surface and locale.
- **QA-LOCALE-01:** `docs/language/visual-qa-by-locale.md` records EN/DE/FR/IT visual checks across desktop and mobile P0 pages.
- **QA-LOCALE-02:** `docs/language/translation-qa-checklist.md` includes Phase 17 natural-copy and responsive-typography checks.
- **DOCS-17-01:** `docs/language/glossary.md` and `docs/language/copy-style-guide.md` reflect final Phase 17 terminology and style decisions.
- **DOCS-17-02:** README documents Phase 17 copy rules, artifacts, verification commands, and maintenance workflow.
- **QA-17-01:** `npm run lint`, `npm run build`, and terminology grep pass after Phase 17 changes.

## Feature Dependencies

```text
LCOPY-01 -> LCOPY-02/03/04/05
LCOPY-* -> P0COPY-*
LAYOUT-02 -> P0COPY-01
LAYOUT-03 -> LAYOUT-04/05
P0COPY-* -> QA-COPY-01
P0COPY-* + LAYOUT-* -> QA-LOCALE-01/02
TERM-17-01 -> DOCS-17-01 -> DOCS-17-02
QA-COPY-01 + QA-LOCALE-01 + QA-17-01 -> milestone closure
```

## MVP Recommendation

Prioritize:

1. Copy rules and terminology guardrails: `locale-copy-rules.md`, German/French/Italian rules, glossary/style-guide updates.
2. Homepage hero and title infrastructure: `titleLines`, `localeLayout.ts`, preferred four-language hero copy.
3. P0 copy rewrites: home, register, chat, pricing, parent report, tutor, billing, support.
4. Visual/copy QA artifacts: copy review matrix, visual QA by locale, translation QA checklist update.
5. README and verification closure.

Defer:

- P1 page rewrites beyond obvious shared/common text: keep the milestone P0-focused.
- Full visual regression tooling: document manual or lightweight screenshot QA first.
- Broad design-system refactors: only adjust typography/layout where locale text proves the need.

## Sources

- `.planning/PROJECT.md` - Phase 17 goal, constraints, preferred hero direction, target features, and out-of-scope boundaries.
- `docs/language/copy-style-guide.md` - Existing voice, terminology replacement, and page guidance.
- `docs/language/glossary.md` - Approved EN/DE/FR/IT terminology and banned user-facing terms.
- `docs/language/translation-qa-checklist.md` - Existing Phase 16 multilingual QA baseline.
- `docs/language/terminology-replacement.md` - Existing terminology audit command and replacement decisions.
- `src/i18n/locales/{en,de,fr,it}/*.json` - Current locale content and P0 namespace structure.
- `src/components/home/HomeHero.tsx`, `src/components/common/PageHeader.tsx`, `src/pages/pricing/PricingPage.tsx`, `src/pages/support/SupportPage.tsx` - High-risk typography and hardcoded/P0 copy surfaces.
- `docs/ia/page-inventory.md` and `docs/ia/route-map.md` - Route priority and P0/P1 surface classification.
