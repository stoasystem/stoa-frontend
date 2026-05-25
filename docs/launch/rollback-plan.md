# Rollback Plan

## Deployment Rollback

- Identify the previous stable frontend deployment.
- Roll production traffic back through the hosting provider.
- Confirm `/login`, `/chat`, `/parent`, `/tutor`, `/admin`, `/pricing`, and `/billing` load.

## Environment Rollback

- Restore previous frontend environment variables.
- Set `VITE_ENABLE_PAYMENT=false` if checkout issues occur.
- Set `VITE_ENABLE_PUBLIC_REGISTER=false` to pause new signups.

## User Communication

- Notify pilot or launch users through the support channel.
- Explain affected features and expected recovery timing.
- Keep tutor/admin operators aware of queue or report delays.
