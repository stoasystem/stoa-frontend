---
status: passed
---

# Phase 190 Verification

## Automated Checks

- `npm run build`: passed.
- Locale roadmap key scan: passed for English, German, French, and Italian.

## Browser Checks

Local dev server:

```text
VITE_API_MODE=mock npm run dev
http://localhost:5174/
```

Verified:

- Student login in mock mode routed to `/practice`.
- `/practice` displayed `Your practice path`, `Current lesson`, `Solving equations in two steps`, `Equations with brackets`, and locked roadmap nodes.
- Locked `Word problems with linear equations` node showed `Complete the previous lesson first.`
- Continue lesson CTA opened `/practice/mathematics/equations/lessons/lesson-linear-2`.
- `/practice/mathematics/equations` displayed `Mathematics: Equations`, roadmap progress, and the available lesson node.
- Mobile viewport 390 x 844 displayed the roadmap, continue CTA, and long lesson title without missing content in the DOM.

## Screenshot Note

In-app browser screenshot capture timed out during Phase 190. Browser DOM and interaction checks passed, and no screenshot artifact was committed.

## Requirement Coverage

- QA35-01: covered by final build.
- QA35-02: covered by browser checks.
- QA35-03: covered by README update.
