# Final Demo Run Result

## Date

2026-05-26

## Environment

- Local frontend: `http://127.0.0.1:5173/`
- Local demo backend: `http://127.0.0.1:8000/`
- Frontend mode: local Vite dev server.
- Demo backend mode: local FastAPI demo backend.

## Commit Hash

Final demo run executed against the working tree based on `bbc630d`; Phase 22 documentation/package changes were committed afterward.

## Tester

Codex local verification.

## Commands Run

| Check | Result | Evidence |
|-------|--------|----------|
| Install | Passed | `npm install --ignore-scripts` returned `up to date`. |
| Demo reset | Passed | `npm run demo:reset` returned `Reset local STOA demo database`. |
| Demo backend startup | Passed | `npm run demo:backend` started on `http://127.0.0.1:8000` after script was updated to use `backend/.venv/bin/python`. |
| Demo backend health | Passed | `GET /health` returned `{"ok":true,"service":"stoa-demo-backend","mode":"demo"}`. |
| Frontend dev server | Passed | `GET http://127.0.0.1:5173/` returned HTTP 200 HTML. |
| Lint | Passed | `npm run lint` exited successfully. |
| Build | Passed | `npm run build` exited successfully; Vite built production assets. |

## Flows Tested

| Flow | Result | Evidence |
|------|--------|----------|
| Student login | Passed | `student@test.com` returned Anna Keller student user. |
| Parent login | Passed | `parent@test.com` returned Martin Keller parent user. |
| Tutor login | Passed | `tutor@test.com` returned Dr. Lena Vogt tutor user. |
| Admin login | Passed | `admin@test.com` returned STOA Admin user. |
| Student conversations | Passed | `GET /conversations` returned 3 conversations. |
| Parent linked child | Passed | `GET /parents/me/children` returned Anna Keller. |
| Tutor requests | Passed | `GET /tutors/me/help-requests` returned pending, assigned, and resolved requests. |
| Admin analytics | Passed | `GET /admin/analytics/overview` returned usage, messages, file, teacher-help, and checkout metrics. |
| Contact form API | Passed | `POST /contact/requests` returned `{ "ok": true, "requestId": ... }`. |
| Support ticket API | Passed | `POST /support/tickets` returned a new open ticket. |
| Frontend homepage | Passed | `GET /` returned HTTP 200. |
| Frontend register | Passed | `GET /register` returned HTTP 200. |
| Frontend chat route | Passed | `GET /chat` returned HTTP 200. |

## Manual Review Items Still Required

- Stakeholder review approval record.
- Manual Safari, Firefox, Edge, Mobile Safari, and Android Chrome pass.
- Manual screen-reader smoke test.
- Native-speaker review for German, French, and Italian.

## Issues Found

- `npm run demo:backend` initially failed with the system Python environment because FastAPI/Starlette were incompatible. The script was updated to use `backend/.venv/bin/python`, then startup passed.
- A stale backend process on port `8000` returned 404 for `/contact/requests`. After stopping the stale process and starting the current backend, contact request submission passed.

## Decision

Internal launch-candidate documentation and local smoke verification passed. External launch-candidate approval still requires stakeholder sign-off and acceptance of known issues.
