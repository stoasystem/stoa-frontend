# Main Website Read-Only Audit

**Phase:** 19 / v1.18
**Audit date:** 2026-05-26
**Source project:** `/Users/zhdeng/newweb`
**Target project:** `/Users/zhdeng/stoa-frontend`

## Read-Only Policy

The company homepage project is a design reference only for Phase 19.

Allowed:

- Read files.
- Inspect CSS, HTML, image names, and layout structure.
- Record design observations.
- Write findings into `stoa-frontend` documentation.

Not allowed:

- Modify `/Users/zhdeng/newweb`.
- Run formatters in `/Users/zhdeng/newweb`.
- Run dependency installation in `/Users/zhdeng/newweb`.
- Delete, move, rename, or overwrite source files.
- Commit from `/Users/zhdeng/newweb`.
- Copy source components, CSS files, or image assets into `stoa-frontend`.

## Git Status Evidence

Pre-research status in `/Users/zhdeng/newweb`:

```text
 M img/team/.DS_Store
```

Post-research status in `/Users/zhdeng/newweb`:

```text
 M img/team/.DS_Store
```

Interpretation:

- The `.DS_Store` modification existed before Phase 19 research began.
- Phase 19 research did not modify it.
- This should be treated as a pre-existing external dirty state.
- Phase 19 acceptance should not claim the source repository is clean unless this external modification is separately resolved by the owner.

## Files Inspected

Source files inspected read-only:

- `/Users/zhdeng/newweb/index.html`
- `/Users/zhdeng/newweb/css/style.css`
- `/Users/zhdeng/newweb/css/default.css`
- `/Users/zhdeng/newweb/css/responsive.css`
- `/Users/zhdeng/newweb/img/` file inventory

Target files inspected:

- `src/index.css`
- `src/styles/stoa-theme.css`
- `src/styles/premium-theme.css`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/home/HomeHero.tsx`

## Source Website Signals Recorded

### Color System

Observed source website colors:

| Signal | Value | Notes |
|--------|-------|-------|
| Primary burgundy | `#9D2235` | Main CTA, hover, accent, menu hover, section emphasis |
| Dark burgundy | `#641320` | Secondary deep accent in some CTA/detail treatments |
| Charcoal | `#212121` | Heading and dark surface signal |
| Near black | `#141b22` | Link/control text and some borders |
| Warm grey | `#F3F3F3` | Large public section background |
| White | `#fff` | Button alternate and card surfaces |
| Muted copy | `#666` | Body text |
| Pale burgundy | `#9D22351C` | Editorial underline/highlight behind heading spans |

### Typography

Observed typography:

- `Prata` imported from Google Fonts for headings.
- `Inter` imported from Google Fonts for body and UI text.
- Body: 16px, normal weight, `#666`, 26px line-height.
- Headings: `Prata`, charcoal, semibold-like weight.
- Section title labels: `Inter`, 14px, 600, uppercase, burgundy.
- Section title headings: often 50px with burgundy highlighted spans.
- Hero title: short stacked editorial phrasing rather than long explanatory copy.

### Spacing and Layout

Observed layout signals:

- Public sections commonly use 120px top/bottom rhythm.
- Hero uses a two-column editorial layout with large copy and a large image/visual composition.
- Services/programs section uses a wide grid with strong surface contrast.
- Navigation and CTA areas use dense but clear top-level groupings.
- The source website is more marketing/editorial than app-like.

### Button Style

Observed button signals:

- Burgundy default fill.
- Charcoal hover fill on standard buttons.
- Square radius (`border-radius: 0`) on primary site buttons.
- 14px semibold text.
- 20px by 30px padding.
- Uppercase transform.
- Plus icon appears in many CTA buttons.

### Card and Tile Style

Observed card/tile signals:

- Strong contrast tiles: charcoal, burgundy, white.
- Service boxes use 50px by 40px padding.
- White cards can have subtle borders.
- Some inner containers use 5px to 10px radius, but many public CTAs and large blocks remain square.
- Shadows are present but not the main brand cue.

### Hero and Editorial Style

Observed homepage hero:

- Short stacked title lines.
- Strong display type.
- Burgundy/charcoal brand contrast elsewhere.
- Large visual image on the side.
- CTA below the editorial heading.

### Image Style

Observed imagery:

- Student and teacher photography.
- Homework and study scenes.
- Classroom/tutoring contexts.
- Large image blocks and image strips.
- Direct education subject matter, not abstract software imagery.

## What Is Reusable

Reusable design signals:

- Burgundy/charcoal/warm-grey palette direction.
- Editorial display rhythm on public surfaces.
- Inter-like UI body style.
- Restrained premium CTAs.
- Education photography tone.
- Large public-page spacing on homepage/auth/report surfaces.
- High-trust, calm education brand mood.

## What Must Not Be Reused Directly

Do not reuse directly:

- Source CSS files.
- Static HTML components.
- Image assets.
- JavaScript effects.
- Exact spacing scale everywhere.
- Exact heading scale in app surfaces.
- Exact uppercase button rule globally.
- Static-site layout assumptions.

## Checklist

- [x] Read-only opened `/Users/zhdeng/newweb`.
- [x] No source files modified by Phase 19 research.
- [x] No formatter run in `/Users/zhdeng/newweb`.
- [x] No dependency install run in `/Users/zhdeng/newweb`.
- [x] No files deleted or moved in `/Users/zhdeng/newweb`.
- [x] No files copied directly from `newweb` into `stoa-frontend`.
- [x] Color system recorded.
- [x] Typography system recorded.
- [x] Spacing recorded.
- [x] Button style recorded.
- [x] Card style recorded.
- [x] Hero style recorded.
- [x] Image style recorded.
- [x] Overall brand tone recorded.

## Audit Conclusion

The company homepage provides a clear premium education design direction: editorial Prata headings, Inter text, burgundy and charcoal accents, warm grey public sections, restrained square CTAs, generous public-page spacing, and real education imagery.

The learning platform should translate those signals into a product UI, not copy the source website. Homepage, auth, and parent report can carry the strongest brand alignment. Chat, dashboard, billing, tutor, support, and admin surfaces should stay app-like, readable, and operational.
