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
- [ ] Teacher support is described as professional help, not replacement or fallback machinery.
- [ ] Pricing uses education value language instead of developer-facing quota enforcement language.

## Layout

- [ ] German navigation and buttons do not overflow desktop navigation.
- [ ] French CTA and form labels wrap cleanly on mobile.
- [ ] Italian pricing and billing cards remain readable on mobile.
- [ ] Buttons allow text expansion rather than truncating important instructions.

## Verification Commands

```bash
npm run lint
npm run build
rg "\bAI\b|AI-|AI |Artificial Intelligence|Chatbot|Robot Tutor|Virtual Teacher|Automated Teacher|Human backup|Teacher Backup|teacher backup|human tutor|What STOA is selling|What we are selling|Buy now|Customers|frontend enforce" src/pages src/components src/i18n -n
```
