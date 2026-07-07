# Home V2 v9 Switch-Over Plan

**Date:** 2026-07-07  
**Current decision:** do not switch `/home-v2` to `/` in v9.

## Future Route Plan

When switch-over is explicitly approved:

1. Preserve the current homepage implementation under a stable fallback route such as `/home-classic`.
2. Route `/` to the Home V2 implementation.
3. Keep `/home-v2` as either an alias during rollout or redirect it to `/` after QA.
4. Re-run desktop/mobile smoke checks on `/`, `/home-v2`, `/home-classic`, `/privacy`, `/terms`, `/login`, `/register`, and role entry routes.

## SEO Plan

- Set `/` title and description to the Home V2 product positioning at switch time.
- Add canonical URL for the active homepage after the production domain is confirmed.
- Update sitemap entries so `/` is the primary homepage and `/home-v2` is removed or marked as non-primary.
- Confirm language alternates only after production locale URL policy is chosen.
- Re-check social preview metadata before public announcement.

## Rollback Plan

- Keep the old homepage route in the codebase for the first controlled rollout.
- Roll back by restoring `/` to the preserved homepage route and keeping `/home-v2` as preview.
- Verify rollback with build, smoke route checks, and browser title/meta checks.
- Record the rollout commit SHA and rollback commit SHA in the switch-over stage.

## Remaining Pre-Switch Conditions

- Owner approval of temporary image use or replacement with final imagery.
- Qualified review of legal pages before public reliance.
- Production deployment domain and canonical URL decision.
- Post-switch analytics and monitoring checklist.
