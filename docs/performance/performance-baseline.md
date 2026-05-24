# Performance Baseline

Phase 8 records a lightweight baseline for staging readiness.

## Pages

Run Lighthouse or browser performance checks on:

- `/login`
- `/dashboard`
- `/chat`
- `/parent`
- `/tutor`

## Targets

- Performance: no obvious regression from previous staging build.
- Accessibility: forms and buttons are usable by label/role.
- Best Practices: no avoidable browser warnings from app code.
- SEO: informational only for app routes.

## Build Baseline

Record `npm run build` output in the milestone verification notes. Vite may warn about a JavaScript chunk over 500 kB; Phase 8 accepts this warning if the build passes and app routes remain responsive.

## Interaction Checks

- Chat send does not visibly freeze the UI.
- Streaming updates remain smooth on mobile.
- Parent report scrolls smoothly.
- Tutor request filtering is immediate.

## Future Automation

Lighthouse CI can be added later with budgets once staging URLs and performance goals stabilize.
