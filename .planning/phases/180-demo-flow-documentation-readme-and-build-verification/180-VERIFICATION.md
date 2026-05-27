# Phase 180 Verification

**Date:** 2026-05-27

## Documentation

Created:

- `docs/home/practice-entry-section.md`
- `docs/home/homepage-cta-hierarchy.md`
- `docs/practice/practice-homepage-entry.md`
- `docs/practice/practice-entry-copy.md`
- `docs/ia/homepage-learning-entry-map.md`
- `docs/demo/homepage-to-practice-demo-flow.md`
- `docs/qa/phase33-homepage-practice-entry-checklist.md`

Updated:

- `README.md`

## Browser Demo Check

Target: `http://127.0.0.1:5174/`

Steps:

1. Open homepage.
2. Confirm Practice entry is present.
3. Confirm Start Practice link href is `/login?next=/practice`.
4. Click Start Practice.
5. Confirm route is `/login?next=/practice`.

Result: Passed.

Observed:

```text
before.href = /login?next=/practice
after.path = /login
after.search = ?next=/practice
```

## Build

Command:

```bash
npm run build
```

Result: Passed.

