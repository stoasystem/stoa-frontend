# Production Readiness

Phase 41 defines production-like deployment and API readiness before STOA adds monitoring, support, admin operations, privacy upgrades, and final pilot launch artifacts.

## Production URL Options

Recommended pilot URL:

- Frontend: `https://pilot.stoa.example`
- Backend API: `https://api-pilot.stoa.example`

Production launch URL options:

- `https://app.stoa.example` for the stable application URL after pilot.
- `https://www.stoa.example` for a public marketing site or redirect, not the primary authenticated app unless product routing is intentionally consolidated.
- Provider-generated URLs from Vercel, Netlify, or another static host may be used for internal verification, but should not be shared as the stable pilot URL.

The selected frontend URL must serve the built Vite SPA from `dist` and support React Router deep-link refreshes through an SPA fallback to `index.html`.

## Backend API Expectations

The frontend must connect to the production backend only through `VITE_API_BASE_URL`.

```bash
VITE_API_BASE_URL=https://api-pilot.stoa.example
```

Production and pilot builds must not use localhost, private LAN hosts, or developer tunnel URLs for the API base URL. `http://localhost:8000` is for local development only.

The backend API is responsible for authentication enforcement, authorization, validation, persistence, rate limits, file scanning/storage policy, analytics ingestion, feedback storage, and operational monitoring. The frontend must not connect directly to a production database.

`VITE_API_URL` appears in an older API helper and should be treated as legacy configuration until that helper is removed or migrated. New production configuration should use `VITE_API_BASE_URL`.

## Production Environment Variables

Production-like pilot example:

```bash
VITE_API_BASE_URL=https://api-pilot.stoa.example
VITE_APP_ENV=production
VITE_ENABLE_DEMO_SHORTCUTS=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FEEDBACK=true
VITE_ENABLE_ERROR_MONITORING=true
```

`VITE_*` variables are public browser configuration. They are embedded into the client bundle and can be read by users. Never put backend secrets, model provider keys, database URLs, signing secrets, service account credentials, private DSNs, or privileged tokens in `VITE_*` variables.

Production configuration rules:

- `VITE_APP_ENV` must be `production` for the stable pilot or production app.
- `VITE_ENABLE_DEMO_SHORTCUTS` must be `false`.
- `VITE_API_BASE_URL` must be an HTTPS backend API URL, not localhost.
- Analytics, feedback, and error monitoring may be enabled only after payload policies and backend endpoints are ready for pilot data.

## Launch Gate Commands

Before publishing a production-like build, run:

```bash
npm run build
npm run preview
```

Use `npm run build` as the required type-check and bundle gate. Use `npm run preview` to inspect the built artifact locally before connecting the same build settings to the deployment provider.

Preview checks should include:

- Open the preview URL.
- Verify `/login`, `/chat`, `/parent`, `/tutor/requests/teacher-request-1`, `/privacy`, and `/terms`.
- Confirm browser network calls target the configured backend API URL.
- Confirm no demo shortcut UI is available when `VITE_ENABLE_DEMO_SHORTCUTS=false`.

## Database Boundary

SQLite is local development, demo, and functional-test infrastructure only. It is acceptable for local backend smoke checks, demo reset flows, and deterministic test data, but it is not the production system of record.

Production database selection belongs behind the backend API. Acceptable backend-owned production options include managed PostgreSQL, a hosted relational database with point-in-time recovery, or another backend-approved production datastore. The frontend should not encode database implementation details, table names, connection strings, migrations, or backup mechanics.

Database migration boundaries:

- Backend owns schema migrations and data migrations.
- Frontend owns API request/response compatibility and user-facing behavior.
- Any data migration that changes visible fields must include a frontend compatibility note before release.
- Rollback plans must account for already-deployed frontend bundles that may still call the previous API contract.

## Pilot API Contract Freeze

Before pilot launch, freeze the frontend/backend contract for:

- Auth: login, registration, current user, logout/401 behavior, role and subscription fields.
- Conversations: conversation list, conversation detail, message send, streaming response, stop behavior, and error shape.
- Files: upload request, uploaded file metadata, size/type validation errors, and file attachment references.
- Teacher help: help request creation, status polling, escalation card fields, tutor-visible request list, and detail timeline.
- Parent reports: children list, child summary, learning history, report stats, weak topics, recommendations, and permissions errors.
- Tutor workflows: request filters, request detail, status update, notes, and forbidden/not-found responses.
- Feedback: feedback create payload, accepted feedback types, route/user context, and persistence response.
- Analytics: event ingestion endpoint, allowed event names, anonymous/session/user identifiers, and rejection behavior.

The freeze means the backend may add optional fields, but must not remove fields, rename fields, change required fields, change enum values, change route paths, or change error status semantics without coordination.

## Breaking Change Coordination

Breaking API changes require:

1. A shared frontend/backend issue or release note that names the affected contract.
2. An additive backend rollout first, when possible.
3. Frontend support for both old and new fields during the transition when feasible.
4. A coordinated removal date after the production frontend bundle has been redeployed and verified.
5. Manual verification of the affected role flows before pilot users are moved to the new contract.

Do not deploy backend-only breaking changes during an active pilot window unless the change fixes a critical security or data integrity issue and the frontend mitigation is included in the same release plan.
