# Release Process

## Branch Flow

MVP launch can use:

1. Pull request to `main`.
2. CI, build, lint, and E2E pass.
3. Deploy staging preview.
4. Manual QA on core flows.
5. Promote to production.

## Release Gates

- No open P0 bugs.
- No open P1 bugs without workaround.
- Environment variables reviewed.
- Monitoring and analytics enabled where expected.
- Support path active.
- Privacy and terms reachable.
- Rollback plan known.

## Environment Checks

`VITE_*` values are public browser configuration. Do not put secrets, payment keys, tokens, or provider credentials in frontend environment variables.
