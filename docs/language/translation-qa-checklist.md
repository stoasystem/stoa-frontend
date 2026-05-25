# Translation QA Checklist

## Core Language Switching

- [ ] English, Deutsch, Français, and Italiano appear in the language switcher.
- [ ] Changing language updates visible homepage copy without reload.
- [ ] Refreshing the page preserves the selected language through `stoa_language`.
- [ ] The root `<html lang>` attribute changes to the selected language.

## Core Pages

- [ ] Homepage supports the four languages.
- [ ] Login and register support the four languages.
- [ ] Student chat empty state, input placeholder, loading state, and teacher request action support the four languages.
- [ ] Parent dashboard and weekly report headers support the four languages.
- [ ] Tutor request dashboard header supports the four languages.
- [ ] Pricing and billing primary copy support the four languages.
- [ ] Support page primary header and contact actions support the four languages.

## Terminology

- [ ] No core user-facing page uses `AI` as the main product term.
- [ ] No core user-facing page uses `human backup` or `teacher backup`.
- [ ] No core user-facing page uses `what we are selling`, `buy now`, or aggressive purchase language.
- [ ] Parent/family-facing copy avoids unnatural `customers` wording where `families` or `parents` is clearer.
- [ ] Teacher support is described as professional help, not replacement or fallback machinery.
- [ ] Pricing uses education value language instead of developer-facing quota enforcement language.

## Copy Quality

- [ ] English copy is calm, premium, educational, and direct.
- [ ] German copy is not a literal English translation and avoids overlong display headings.
- [ ] French copy is clear and elegant without becoming abstract or too long.
- [ ] Italian copy is natural, warm, and clear.
- [ ] Hero titles fit each language's length guidance.
- [ ] CTA labels are short, clear, and action-oriented in all four languages.
- [ ] Parent report copy is supportive and non-alarmist.
- [ ] Tutor copy is professional and does not imply teacher replacement.

## Layout

- [ ] German navigation and buttons do not overflow desktop navigation.
- [ ] German hero title uses short title text or stacked title lines instead of a long translated sentence.
- [ ] French CTA and form labels wrap cleanly on mobile.
- [ ] Italian pricing and billing cards remain readable on mobile.
- [ ] Buttons allow text expansion rather than truncating important instructions.
- [ ] Pricing cards remain visually balanced in all four languages.
- [ ] Register form labels remain readable in all four languages.
- [ ] Chat teacher request action remains readable in all four languages.

## Phase 17 Required Viewports

- [ ] 375px
- [ ] 430px
- [ ] 768px
- [ ] 1024px
- [ ] 1440px

## Verification Commands

```bash
npm run lint
npm run build
rg "\bAI\b|AI-|AI |Artificial Intelligence|Chatbot|Robot Tutor|Virtual Teacher|Automated Teacher|Human backup|Teacher Backup|teacher backup|human tutor|What STOA is selling|What we are selling|Buy now|Customers|frontend enforce" src/pages src/components src/i18n -n
```
