# Known Issues

P0 issues are not allowed in this list. Any P0 must be fixed before launch-candidate approval.

| ID | Severity | Page | Description | Workaround | Owner | Decision |
|----|----------|------|-------------|------------|-------|----------|
| KI-001 | P2 | QA | Safari, Firefox, Edge, Mobile Safari, and Android Chrome manual passes are not yet recorded in the final demo run. | Use Chromium for local scripted demo and record browser-specific manual checks before external launch. | QA | Later |
| KI-002 | P2 | Accessibility | Manual screen-reader smoke test is not yet recorded for LC1. | Use keyboard/source accessibility evidence for internal demo; complete VoiceOver/NVDA pass before public demo release. | QA | Later |
| KI-003 | P2 | Translation | Native-speaker review for German, French, and Italian remains recommended. | Use current reviewed copy for internal demo; schedule native review before public release. | Product | Later |
| KI-004 | P3 | Visual Regression | Screenshot baseline strategy exists, but committed PNG baselines are optional and not required for LC1. | Use Playwright/browser smoke plus manual screenshots for stakeholder review. | Frontend | Later |

## Rules

- P0 issues: fix now, not accepted here.
- P1 issues: accepted here only with explicit workaround.
- P2/P3 issues: accepted when they do not block final demo or launch-candidate decision.

