# Color Contrast Audit

## Token Review

Primary Phase 21 platform tokens:

| Token | Usage | Assessment |
| --- | --- | --- |
| `--foreground` on `--background` | Main text | Strong contrast by visual/token review. |
| `--card-foreground` on `--card` | Card text | Strong contrast by visual/token review. |
| `--muted-foreground` on light surfaces | Secondary text | Kept at a darker neutral value (`217 14% 40%`) to avoid low-contrast beige text. |
| `--primary-foreground` on `--primary` | Primary buttons | Strong contrast. |
| `--accent` | Icons, small accents, non-critical highlights | Used mostly as icon/accent color, not sole text indicator. |
| `--ring` | Focus outline | Visible warm-gold outline with 3px offset. |

## Phase 120 Fixes

- Added a global visible focus fallback for links and controls.
- Marked decorative icons as `aria-hidden` so color is not the only semantic cue.
- Kept error text paired with alert roles, not color alone.

## Areas To Recheck In Browser QA

- Muted text in footer on small mobile screens.
- Gold accent icon visibility on ivory surfaces.
- Badge text for pending/resolved/active states.
- Logo variants on header/footer backgrounds.
- Focus outline visibility in Safari and Firefox.

## Status

No obvious token-level WCAG AA blocker was found in source review. A rendered contrast checker should still be run during the Phase 121 browser QA pass.
