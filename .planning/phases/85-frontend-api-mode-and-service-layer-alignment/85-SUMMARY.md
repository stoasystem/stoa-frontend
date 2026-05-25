# Phase 85 Summary: Frontend API Mode and Service Layer Alignment

## Completed

- Added explicit API mode, API base URL, MSW flag, and demo fallback gating.
- Updated shared HTTP client to use centralized API base URL.
- Updated stream and analytics services to use centralized API base URL.
- Gated auth/demo fallback behavior so staging/production do not silently use mock data.
- Updated `.env.example` for demo, staging, production, and mock modes.
- Audited page/component/hook API usage.

## Files

- `.env.example`
- `src/lib/env.ts`
- `src/services/api/httpClient.ts`
- `src/services/demo/demoFallback.ts`
- `src/services/auth/authApi.ts`
- `src/services/chat/chatStreamApi.ts`
- `src/services/analytics/analyticsClient.ts`
- `src/pages/admin/Dashboard.tsx`

