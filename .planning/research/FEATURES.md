# Phase 16 Research: Features

## Table Stakes

### Multilingual Foundation

- Four supported languages: English, German, French, Italian.
- Default language: English.
- Locale files are grouped by namespace so migration can happen in P0/P1 slices.
- Missing translations fall back to English.
- Current language persists through page refresh.
- The root HTML `lang` value follows the active language.

### Language Switcher

- Available in public navigation, login/register, app user menu, and footer.
- Displays language names, not flags.
- Supports `English`, `Deutsch`, `Français`, and `Italiano`.
- Works on desktop and mobile without forcing narrow buttons.
- Does not appear near the chat input where it would distract from studying.

### Terminology Replacement

User-visible copy should avoid `AI` as the primary product concept. Replace with:

- `Learning Assistant`
- `STOA Learning Assistant`
- `Learning support`
- `Explanation`
- `Professional teacher support`

Avoid:

- `AI`
- `AI Tutor`
- `Chatbot`
- `Robot Tutor`
- `Virtual Teacher`
- `Automated Teacher`
- `Human backup`
- `Teacher backup`

### Core Page Localization

P0 pages:

- Homepage
- Login
- Register and role onboarding
- Chat
- Teacher request action
- Parent dashboard
- Parent report
- Tutor request flow
- Pricing
- Billing
- Support

P1 pages:

- Profile
- Learning history
- Referral
- Tutor availability
- Admin overview

### Interaction Copy Localization

- Form validation messages.
- Toast messages.
- Empty/loading/error states.
- CTA labels.
- Role labels.
- Plan/pricing labels.
- Support ticket statuses and severity labels.

## Differentiators

- Swiss-market language set from the start: EN / DE / FR / IT.
- Education-first language system instead of technical hype.
- Clear hierarchy: Learning Assistant first, professional teacher support when needed, parents stay informed.
- Glossary and style guide included so future contributors do not reintroduce weak terminology.

## Anti-Features

Do not:

- Treat `AI` as a visible selling point.
- Add a translation management platform.
- Add backend language preference syncing.
- Add locale URL routing.
- Localize legal text as if it were legally approved final copy.
- Auto-translate production copy without review.
- Hide long German/French labels through truncation when the text is essential.
