# Phase 19 Research: Architecture

## Integration Points

The safest architecture is documentation plus token/component refinement:

1. Read-only source audit:
   - `/Users/zhdeng/newweb/css/style.css`
   - `/Users/zhdeng/newweb/css/default.css`
   - `/Users/zhdeng/newweb/css/responsive.css`
   - `/Users/zhdeng/newweb/index.html`
   - representative image directories under `/Users/zhdeng/newweb/img/`
2. Learning platform design docs:
   - `docs/design/*`
3. Token layer:
   - Add `src/styles/brand-tokens.css` for translated brand variables.
   - Add `src/styles/platform-theme.css` for app-specific applications.
   - Import through `src/index.css`.
4. Component layer:
   - Update `Button`, `Card`, `Badge`, inputs, page headers, chat bubbles, pricing/billing cards, and report components through existing abstractions where possible.
5. Page layer:
   - Use light scoped classes and existing layout components for homepage/auth/report/app-page refinements.

## Main Website Signals

Observed signals:

- Typography: `Prata` for display/editorial headings, `Inter` for body and UI copy.
- Primary brand accent: burgundy `#9D2235`.
- Charcoal/dark surface: `#212121`.
- Warm neutral page surface: `#F3F3F3`.
- Body copy: muted grey `#666`.
- Main section rhythm: `pt-120 pb-120`.
- Buttons: uppercase, 14px, 600 weight, 20px vertical padding, mostly square/zero radius, burgundy fill, charcoal hover.
- Section headers: large editorial serif, often with burgundy highlighted span and pale underline block.
- Cards/tiles: mixed dark/burgundy/white blocks, modest 10px radius on some surfaces, light shadows.
- Visual style: education photography, large hero image, image strips, editorial split text, restrained decorative lines/logos.

## Learning Platform Adaptation

- Use burgundy as a derived brand accent, not as the only primary action color everywhere.
- Keep app navigation slightly cooler/darker for usability.
- Use editorial serif for homepage/auth/report hero headings only.
- Keep dashboards/chat in clear app typography.
- Use low-radius or subtly squared surfaces on marketing/auth/report pages; keep app cards controlled and scannable.
- Reduce bright SaaS blue/teal dominance while preserving clear interactive affordances.

## Build Order

1. Document source audit and translation rules.
2. Add token layer and import it.
3. Refine core primitives.
4. Refine P0 public/auth/report pages.
5. Refine P0 app pages.
6. Run visual compatibility QA and build.

