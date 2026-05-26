# Deployment Handoff

**Release:** STOA Learning Platform public demo release
**Date:** 2026-05-26
**Frontend artifact:** Vite static SPA in `dist/`
**Current verified commit:** `2831d5f`

## Deployment Target

Use the configured static frontend hosting target for the public demo branch. The release artifact is the Vite `dist/` directory.

Required hosting behavior:

- Serve `dist/index.html` for client-side routes.
- Preserve HTTPS.
- Keep frontend environment variables public-safe.
- Do not expose backend secrets or provider keys through `VITE_*`.

## Environment Variables

Public demo release recommended values:

```bash
VITE_API_MODE=demo
VITE_API_BASE_URL=https://<public-demo-api-host>
VITE_APP_ENV=public-demo
VITE_ENABLE_MSW=false
VITE_ENABLE_DEMO_SHORTCUTS=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FEEDBACK=true
VITE_ENABLE_ERROR_MONITORING=true
VITE_ENABLE_PAYMENT=false
VITE_ENABLE_MOCK_CHECKOUT=false
VITE_ENABLE_PUBLIC_REGISTER=false
VITE_ENABLE_TEACHER_HELP=true
VITE_ENABLE_PARENT_REPORT=true
VITE_ENABLE_REFERRAL=true
VITE_ENABLE_SUPPORT_TICKETS=true
VITE_ENABLE_DEMO_API=false
VITE_SHOW_DEMO_ACCOUNTS=false
VITE_SHOW_DEMO_BADGES=false
VITE_SHOW_DEMO_SURFACES=false
VITE_SHOW_INTERNAL_DEBUG=false
```

## API Mode

The frontend should point to the public demo API host through `VITE_API_BASE_URL`.

For local verification:

```bash
VITE_API_MODE=demo
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For public deployment, replace the base URL with the hosted API URL and keep all internal/demo visibility flags hidden.

## Build Command

```bash
npm ci
npm run build
```

## Preview Command

```bash
npm run preview
```

Default local preview URL:

```text
http://localhost:4173
```

## Required Post-Deploy Route Checks

- `/`
- `/register`
- `/login`
- `/chat`
- `/parent`
- `/parent/children/user-student/report`
- `/tutor`
- `/admin`
- `/pricing`
- `/contact`
- `/privacy`
- `/terms`

## Rollback Instruction

1. Keep the previous known-good deployment active or available in the hosting platform.
2. If the public demo deploy fails route, login, chat, contact, or parent report smoke checks, roll back to the previous deployment immediately.
3. Restore the prior environment variable set with demo accounts, demo badges, and internal debug still hidden.
4. Re-run the Phase 130 smoke set before retrying release.

## Contact Person

Release owner: STOA frontend owner / project operator.

Escalate blockers to:

- Product owner for Go / No-Go decisions.
- Frontend owner for UI, route, build, or environment issues.
- Demo backend owner for API availability or data reset issues.

## Known Limitations

- This public demo release is not the full production system.
- Payment collection is not live.
- Public registration is disabled unless explicitly enabled by release owner.
- Real backend, AWS production integration, CRM, monitoring, and production operations remain future handoff work.
- Manual Safari, Firefox, Edge, Mobile Safari, Android Chrome, screen-reader, and native-speaker checks remain recommended before broader rollout.

