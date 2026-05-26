# Learning Platform Token Adjustment

**Phase:** 19 / v1.18
**Status:** Implemented

## Source Translation

The token work translates the company homepage signals into an app-safe STOA learning-platform theme. It does not copy homepage CSS, components, or assets.

Source signals used:

- Burgundy brand anchor from `#9D2235`.
- Dark burgundy depth from `#641320`.
- Charcoal visual weight from `#212121`.
- Warm grey public sections from `#F3F3F3`.
- White and warm card surfaces.
- Muted grey body text.
- Editorial heading rhythm.

## Implemented Files

- `src/styles/brand-tokens.css`
- `src/styles/platform-theme.css`
- `src/index.css`

The new styles are imported after the existing STOA and premium themes so they refine the current system rather than replacing it wholesale.

## Token Families

| Token family | Purpose |
|--------------|---------|
| `--stoa-brand-burgundy` | Derived app brand action color. |
| `--stoa-brand-burgundy-strong` | Hover, pressed, and strong report emphasis. |
| `--stoa-brand-burgundy-soft` | Soft badge, hover, and teacher-support tint. |
| `--stoa-brand-charcoal` | App navigation, dark image overlays, strong text. |
| `--stoa-brand-ink` | Highest contrast text and icons. |
| `--stoa-brand-paper` | Warm page background. |
| `--stoa-brand-card` | Warm card and form surface. |
| `--stoa-brand-muted-text` | Secondary copy. |
| `--stoa-brand-border` | Warm subtle borders. |

## Theme Mapping

The Tailwind theme variables now resolve to the translated brand family:

- `--background`: warm paper.
- `--foreground`: ink.
- `--card`: warm card surface.
- `--primary`: derived burgundy.
- `--accent`: derived burgundy.
- `--secondary` / `--muted`: warm neutral.
- `--border` / `--input`: warm border.
- `--ring`: burgundy focus.

## Component Implications

Buttons:

- Primary actions use burgundy and charcoal hover.
- Outline and ghost buttons use warm neutral hover states.
- App buttons keep familiar radius and focus states.

Cards:

- Default cards receive a warmer surface, subtler border, and softer shadow.
- Featured cards use a narrow burgundy top rule rather than heavy full-card color.

Badges:

- Secondary badges use soft burgundy instead of bright SaaS tints.
- Status colors remain readable and restrained.

Inputs:

- Form controls use warm card backgrounds, warm borders, and burgundy focus rings.

App surfaces:

- The app shell uses warm app backgrounds and a calmer sidebar.
- Chat uses a distinct workspace background while keeping message readability.

## Public/App Split

Public/auth/report surfaces get the strongest editorial brand treatment:

- Homepage.
- Login.
- Register/onboarding.
- Pricing hero.
- Parent report.

Operational surfaces remain app-like:

- Chat.
- Student dashboard.
- Billing.
- Tutor/support/admin pages.

## Multilingual Stability

The token changes preserve Phase 17 safeguards:

- German stacked hero title remains component-driven.
- Long labels still wrap in buttons and pricing cards.
- CTAs are not globally forced uppercase.
- Dense app surfaces avoid oversized display typography.

## No-Copy Confirmation

- No CSS files were copied from `/Users/zhdeng/newweb`.
- No image assets were copied from `/Users/zhdeng/newweb`.
- No static homepage components were copied.
- The source project remained read-only during token implementation.
