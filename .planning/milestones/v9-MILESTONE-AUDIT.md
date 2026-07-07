# v9 Milestone Audit: Home V2 Final Issue Cleanup

**Date:** 2026-07-07  
**Status:** Complete  
**Decision:** Ready for switch-over planning; not a route switch.

## Scope Audit

| Scope Item | Result |
|------------|--------|
| Preserve current `/` | Passed |
| Fix `/home-v2` FR mobile overflow | Passed |
| Improve mobile Hero image rhythm | Passed |
| Remove visible legal draft/review framing | Passed |
| Add product metadata and route-level metadata | Passed |
| Document temporary image approval | Passed |
| Document future switch-over/rollback plan | Passed |
| Commit screenshots | Not done; screenshots stayed in `/private/tmp/stoa-home-v2-v9/` |

## Verification

- `git diff --check`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with existing Vite chunk-size warning.
- `npm run test:e2e -- home-v2.spec.ts localization-preferences.spec.ts`: passed, 5/5 tests.
- Browser layout audit: passed for EN/DE/FR/IT desktop and mobile.
- Legal render audit: passed for EN/DE/FR/IT `/privacy` and `/terms`.

## Remaining Conditions

- Dedicated route-switch stage before replacing `/`.
- Final imagery procurement or explicit owner approval of temporary imagery for controlled launch.
- Qualified legal review before public reliance.
- Production canonical/sitemap/language alternate/rollback execution plan.
