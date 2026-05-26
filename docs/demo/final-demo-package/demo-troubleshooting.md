# Demo Troubleshooting

## Frontend Does Not Start

1. Run `npm install`.
2. Run `npm run dev -- --host 127.0.0.1`.
3. If port `5173` is busy, stop the existing process or use the URL shown by Vite.

## Demo Backend Does Not Start

1. Run `npm run demo:backend`.
2. Check Python dependencies under `backend/.venv` if the system Python lacks FastAPI.
3. Open `http://127.0.0.1:8000/health`.

## Data Looks Wrong

1. Stop the demo backend if it is running.
2. Run `npm run demo:reset`.
3. Start `npm run demo:backend` again.
4. Sign in with one of the fixed demo accounts.

## Login Fails

1. Confirm the demo backend is running.
2. Confirm credentials match `demo-accounts.md`.
3. Reset demo data.
4. Clear local storage keys `stoa_access_token`, `stoa_user`, and `stoa_language` only if the browser appears stuck with an old session.

## Language Switcher Fails

1. Reload the page.
2. Check `localStorage.stoa_language`.
3. Use English for the demo if a locale-specific copy issue blocks the flow, then log the issue in known issues.

## Contact Or Support Submission Fails

1. Confirm the backend is running.
2. Confirm the form has all required fields.
3. Reset demo data if repeated submissions created confusing state.
4. Move the issue to final bug triage if it blocks formal demo flow.

## Mobile Layout Looks Wrong

1. Test at 375px, 390px, 430px, 768px, and desktop widths.
2. Use English for the live demo if a locale-specific long label blocks the flow.
3. Record the page, viewport, language, and screenshot notes in known issues.

