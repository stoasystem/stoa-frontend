# Staging Deployment

Phase 8 prepares STOA Frontend for a staging deployment. Staging is for team QA, early student/parent/tutor trials, and investor/demo checks. It is not production.

## Planned URLs

- Frontend staging: `https://staging.stoa.example`
- Backend staging: `https://api-staging.stoa.example`

Use provider-generated URLs until final domains exist.

## Build Settings

- Install: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Local preview: `npm run preview`

## Environment Variables

```bash
VITE_API_BASE_URL=https://api-staging.stoa.example
VITE_APP_ENV=staging
VITE_ENABLE_DEMO_SHORTCUTS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FEEDBACK=true
```

Production should disable demo shortcuts:

```bash
VITE_API_BASE_URL=https://api.stoa.example
VITE_APP_ENV=production
VITE_ENABLE_DEMO_SHORTCUTS=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FEEDBACK=true
```

Never put backend secrets, model API keys, database URLs, or private credentials in `VITE_*` variables.

## SPA Fallback

React Router paths must resolve to `index.html` when refreshed.

- Vercel: `vercel.json`
- Netlify: `public/_redirects`

Routes to verify after deploy:

- `/login`
- `/chat`
- `/parent`
- `/parent/children/user-student/report`
- `/tutor/requests/teacher-request-1`
- `/privacy`
- `/terms`

## Redeploy

1. Push to the connected branch.
2. Confirm CI passes.
3. Confirm the deployment platform built `dist`.
4. Open the staging URL.
5. Run the route checks above.
6. Login with demo accounts and complete the MVP demo flow.

## Local Preview

```bash
npm run build
npm run preview
```

Open `http://localhost:4173` and verify the same routes.
