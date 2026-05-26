# Cross-Browser QA

## Automated Coverage

Command:

```text
npm run test:e2e
```

Result:

```text
12 passed
```

Automated coverage currently runs on Chromium through Playwright. The suite verifies:

- Public pricing and unauthenticated billing redirect
- Login/logout
- Student navigation and chat
- Parent dashboard, report, and monthly report
- Tutor request workflow
- Billing plan preview
- Admin and organization demo-surface navigation in explicit demo QA mode
- Breadcrumbs and return actions

## QA Mode

Playwright is configured to use deterministic frontend demo fallback data:

```text
VITE_API_BASE_URL=http://127.0.0.1:65535
VITE_ENABLE_DEMO_API=true
VITE_ENABLE_MOCK_CHECKOUT=true
VITE_ENABLE_PAYMENT=false
VITE_SHOW_DEMO_SURFACES=true
```

This avoids accidental coupling to a local backend process with partial seed data.

## Manual Browser Matrix

| Browser | Status | Notes |
| --- | --- | --- |
| Chrome latest | Automated Chromium pass | Covers core flows. |
| Edge latest | Pending manual check | Same Chromium engine, still requires visual/focus check. |
| Firefox latest | Pending manual check | Verify font rendering, selects, focus rings, and chat input. |
| Safari latest | Pending manual check | Verify sticky header, focus outline, form controls, and footer layout. |
| Mobile Safari | Pending manual check | Covered by mobile-device QA checklist. |
| Android Chrome | Pending manual check | Covered by mobile-device QA checklist. |

## Known Limits

Local Playwright projects only include Chromium. Firefox, Safari, Edge, and mobile browser checks remain manual release-gate items.
