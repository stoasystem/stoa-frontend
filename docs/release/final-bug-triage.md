# Final Bug Triage

## Severity Classes

| Severity | Meaning | Required Action |
|----------|---------|-----------------|
| P0 | Blocks demo or core launch-candidate flow. | Must fix before launch candidate. |
| P1 | Clearly harms credibility or main-path experience. | Fix if feasible; otherwise needs documented workaround. |
| P2 | Acceptable for launch candidate but should be tracked. | Record in known issues. |
| P3 | Later improvement or polish. | Move to next-stage backlog. |

## Rules

- P0 issues cannot enter known issues.
- P1 issues can enter known issues only with a clear workaround.
- P2 issues can enter known issues.
- P3 issues should enter the next-stage backlog.
- New product features are not accepted as bug fixes.
- Large refactors, broad visual redesign, and API shape changes are not accepted unless they fix a P0 blocker.

## Current Triage

| ID | Severity | Page | Description | Decision | Owner |
|----|----------|------|-------------|----------|-------|
| TRIAGE-001 | P1 | Register | Role selection previously lacked visible feedback; fixed before LC1 package commit. | Fix now | Frontend |
| TRIAGE-002 | P2 | Header | Language switcher wording was repetitive; compact short labels fixed before LC1 package commit. | Fix now | Frontend |
| TRIAGE-003 | P2 | Login | Login page needed richer presentation; fixed before LC1 package commit. | Fix now | Frontend |

## Triage Status

P0 count: 0 known at planning time.
