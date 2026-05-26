# Release Quality Gate

## Required Before Launch Candidate

| Gate | Status | Evidence |
| --- | --- | --- |
| Install | Pass | `npm install --ignore-scripts` passed. |
| Dev server | Pass | `npm run dev -- --host 127.0.0.1` started successfully with approval. |
| Build | Pass | `npm run build` passed. |
| E2E smoke | Pass | `npm run test:e2e` passed: 12 tests. |
| Footer contact details | Pass | Footer uses `info@stoaedu.ch`, `+41 78 332 37 96`, and `Zürich · Schindellegi (SZ) · Würenlos (AG)`. |
| Logo adaptation | Pass | `StoaLogo` provides CSS/token variants without copying homepage assets. |
| Contact form | Pass | `/contact` has localized form, pending guard, success/error states, and API contract. |
| Accessibility source audit | Pass with manual follow-up | Docs under `docs/accessibility/`; rendered axe/manual AT check still required. |
| Keyboard source audit | Pass with manual follow-up | Global focus fallback and key form/chat fixes added. |
| Contrast source audit | Pass with manual follow-up | Token review complete; rendered contrast tooling still recommended. |
| Cross-browser QA | Partial | Chromium automated; Safari, Firefox, Edge, Mobile Safari, Android Chrome remain manual gates. |
| Mobile QA | Pending manual | Matrix documented in `docs/qa/mobile-device-qa.md`. |
| Visual regression | Strategy documented | Functional E2E is green; screenshot baseline strategy documented but PNG baselines not committed. |
| Main website safety | Pass | `/Users/zhdeng/newweb` still only shows pre-existing `M img/team/.DS_Store`. |

## Blocking Criteria

Do not mark a launch candidate ready if any of these fail:

- Production build fails.
- Core E2E smoke fails.
- Contact form cannot submit in demo QA mode.
- Footer contact information is missing or inaccurate.
- Normal user-facing UI exposes demo/mock/Codex development language.
- Keyboard navigation blocks login, register, chat, pricing, or contact.
- A P0 page has obvious mobile overflow.

## Manual Release Gates Still Required

- Safari latest
- Firefox latest
- Edge latest
- Mobile Safari
- Android Chrome
- Screen reader smoke with VoiceOver or NVDA
- Rendered color contrast audit
- Stakeholder visual review
