# E2E Testing

Phase 8 adds Playwright smoke tests for the core STOA role loop.

## Setup

```bash
npm install
npx playwright install
```

The tests expect the local backend to be available at `http://localhost:8000`.

```bash
cd backend
.venv/bin/python -m app.reset_demo_data
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000
```

In another terminal:

```bash
npm run test:e2e
```

Interactive mode:

```bash
npm run test:e2e:ui
```

## Coverage

- `auth.spec.ts`: student login and logout.
- `student-chat.spec.ts`: student chat send and teacher help request.
- `parent-dashboard.spec.ts`: parent child summary and weekly report.
- `tutor-workflow.spec.ts`: tutor request filtering and status update.

## Debugging

- Reset demo data before rerunning a failed suite.
- Check that `VITE_API_BASE_URL` points to the local backend.
- Run one file at a time with `npx playwright test tests/e2e/auth.spec.ts`.
- Use `npm run test:e2e:ui` for traces and screenshots.
