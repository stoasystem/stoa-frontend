# Phase 19 Research: Pitfalls

## Pitfall: Copying the Main Website

Directly copying `css/style.css` or HTML sections would import a global Bootstrap-era marketing system into a React/Tailwind app. This would break component boundaries and make the learning platform look like a homepage page instead of a product.

Prevention:

- Translate design signals into tokens and local component refinements.
- Keep docs explicit about what not to copy.
- Do not copy files or components from `/Users/zhdeng/newweb`.

## Pitfall: Losing App Usability

The company homepage uses large editorial sections, 120px vertical rhythm, and image-led marketing composition. Dashboards, chat, billing, and support need faster scanning and denser interaction.

Prevention:

- Apply homepage-like rhythm mainly to homepage/auth/report.
- Keep chat/dashboard typography and spacing practical.
- Use accents subtly in dense surfaces.

## Pitfall: Overusing Burgundy

The main website leans heavily on `#9D2235`. Applying it everywhere would make statuses and CTAs loud and reduce hierarchy.

Prevention:

- Define derived app tokens such as `brand.primaryApp`, `accent.soft`, and `interactive.primary`.
- Use burgundy for important accents and selected primary actions, not every state.

## Pitfall: Breaking Phase 17 Multilingual Fit

Typography and spacing changes can reintroduce German/French/Italian overflow.

Prevention:

- Re-test EN/DE/FR/IT on P0 pages.
- Keep German stacked hero support.
- Avoid viewport-width font scaling.
- Preserve `min-w-0`, wrapping, and scroll containment safeguards.

## Pitfall: Dirty Source Project

The source project must be read-only. Initial check already shows a pre-existing modified `.DS_Store` in `/Users/zhdeng/newweb`.

Prevention:

- Do not write to `/Users/zhdeng/newweb`.
- Record the pre-existing dirty file in the read-only audit.
- Re-check `git status` after work and distinguish pre-existing state from Phase 19 work.

