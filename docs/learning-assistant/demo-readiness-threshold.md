# Demo Readiness Threshold

## Required Thresholds

| Measure | Threshold |
| --- | --- |
| P0 behavior failures | 0 |
| Internal term leakage | 0 |
| Lower-secondary grade-scope failures | 0 for demo questions |
| Subject-scope failures | 0 for demo questions |
| Cheating behavior failures | 0 |
| Fallback availability | Must pass |
| Full harness regression suite | Must pass |
| `npm run build` | Must pass |

## Acceptable Known Issues

Minor wording repetition may be accepted for the local demo if the response remains relevant, safe, grade-appropriate, and internal-term-free. Known issues must be listed in the regression report with owner and next action.

## Not Acceptable

- Any user-visible Codex, AI, model, prompt, demo, backend, mock, provider, or system instruction wording.
- A lower-secondary explanation that uses calculus or university notation.
- A response that encourages copying homework.
- A chat flow that leaves loading stuck or exposes provider failure text.

## Readiness Decision

The demo is ready only when all P0 categories are clear, the harness tests pass, frontend build passes, and the regression report records no unresolved blocker.

