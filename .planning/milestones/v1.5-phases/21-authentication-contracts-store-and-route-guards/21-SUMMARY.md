# Phase 21 Summary

## Completed

- Added `AuthResponse`, auth service, auth mutations, and current-user hydration query.
- Refactored canonical auth store to persist `stoa_access_token`, set user, clear auth, and hydrate from storage.
- Updated shared HTTP client to inject bearer token and route 401/403 responses.
- Added protected and role route guards.
- Added login, register, forgot-password, unauthorized, and forbidden route surfaces.

## Verification

- `npm run build` passed.
- `npm run lint` passed.
