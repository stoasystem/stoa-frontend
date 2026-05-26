# Phase 20 Research: Pitfalls

**Milestone:** v1.19 Phase 20

## Source Safety Pitfalls

- Running formatter, install, build, or cleanup commands inside `/Users/zhdeng/newweb`.
- Accidentally modifying `.DS_Store` or generated files in the source project.
- Copying homepage components, CSS, or full paragraphs into the learning platform.
- Treating the current source status as clean when it has a pre-existing `M img/team/.DS_Store`.

Prevention:

- Use only read commands for `/Users/zhdeng/newweb`.
- Check `git -C /Users/zhdeng/newweb status --short` before and after work.
- Document the pre-existing `.DS_Store` change clearly.

## Copy Quality Pitfalls

- German copy becomes literal English with longer sentence structure.
- German formal/informal address becomes inconsistent.
- `Schülerinnen und Schüler` is overused in compact UI labels where shorter terms would fit better.
- `Lehrpersonen-Unterstützung` and other compound forms create heavy UI text.
- French apostrophes get mixed between straight `'` and typographic `’`.
- Italian CTA text is natural but too long for buttons.
- English slips back into SaaS/sales language such as `customers`, `buy now`, or hype claims.

Prevention:

- Use style rules per language before editing JSON.
- Prefer short German labels and explanatory subtitles.
- Use typographic apostrophe `’` consistently in French and Italian.
- Add short CTA variants only where components can consume them.
- Scan user-facing locale files for banned or risky terminology.

## Layout Pitfalls

- Copy changes pass in JSON but overflow in real UI.
- German and French labels make nav/action rows wrap awkwardly.
- Pricing cards become uneven from longer feature text.
- Register role cards grow too tall on mobile.
- Chat teacher request action becomes unreadable on narrow screens.

Prevention:

- Keep components flexible with `min-w-0`, `break-words`, `whitespace-normal`, and wrapping action rows.
- Use `localeLayout.ts` for repeated locale-driven differences.
- Prefer shorter copy over shrinking type.
- Run visual checks across target routes, four locales, and widths 375, 430, 768, 1024, and 1440 where feasible.

## Scope Pitfalls

- Expanding into new pages or features while refining copy.
- Attempting final legal/professional translation.
- Creating a CMS or translation workflow.
- Rewriting the visual system again after Phase 19.

Prevention:

- Requirements should explicitly exclude new functionality, new languages, CMS, and legal-final translation.
- Roadmap should separate docs/rules, copy edits, layout adaptation, and QA.

