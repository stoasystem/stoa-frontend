# Phase 185 Verification

## Build

```bash
npm run build
```

Result: passed.

## Browser Flow

Environment:

```bash
VITE_API_MODE=mock npm run dev -- --host 127.0.0.1
```

Result: passed.

Checked:

- Home Start Practice -> `/login?next=/practice`
- Student login -> `/practice`
- `/practice` generalized copy and demo label
- `/practice/mathematics/equations`
- `/practice/mathematics/equations/lessons/lesson-linear-2`
- `/dashboard` generalized Practice card copy

## Four-Language Mobile Homepage

Viewport: 390 x 844

Result: passed for English, German, French, and Italian.

Checks:

- Practice entry rendered.
- Current demo label rendered.
- No page-level horizontal overflow.

## Static Copy Scan

High-risk equation-only Practice product phrases: no matches in `src/i18n`, `src/components`, or `src/pages`.
