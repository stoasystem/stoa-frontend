---
phase: 109
slug: learning-platform-brand-tokens-and-theme-layer
milestone: v1.18 Phase 19
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-26
---

# Phase 109-112 UI Design Contract

> Visual and interaction contract for STOA Frontend Phase 19: brand-aligned visual refinement with main website design translation. Generated for the Phase 109 token/theme layer and consumed by Phases 110-112.

## Scope

This contract governs Phase 19 visual work across:

- Phase 109: learning-platform brand tokens and theme layer.
- Phase 110: shared component visual refinement.
- Phase 111: public and auth surface alignment.
- Phase 112: app page alignment, visual QA, README, and handoff.

The design relationship is: **same brand family, different product surface**.

`/Users/zhdeng/newweb` is a read-only reference only. Do not write to it, format it, install dependencies there, commit there, or copy CSS/components/assets/images from it.

## Source Decisions

| Source | Decisions Used |
|--------|----------------|
| `.planning/PROJECT.md` | Phase 19 goal: align with company homepage while keeping the platform independent and app-like. |
| `.planning/ROADMAP.md` | Phase 109-112 scope, target surfaces, no-copy rule, and visual QA expectations. |
| `.planning/REQUIREMENTS.md` | TOKEN19, COMP19, PAGE19, and QA19 acceptance criteria. |
| Phase 108 `RESEARCH.md` | Source signals: burgundy, charcoal, warm grey, editorial display type, restrained square CTAs, education imagery, generous public rhythm. |
| `docs/design/main-website-readonly-audit.md` | Read-only evidence and reusable vs prohibited source signals. |
| `docs/design/main-website-design-translation.md` | Page-level adaptation rules and "same brand family, different product surface" boundary. |
| Current code | Tailwind v4 CSS theme variables, shadcn-style local UI primitives, Radix primitives, lucide icons, React/Vite app routes. |

## Design System

| Property | Value |
|----------|-------|
| Tool | Manual local shadcn-style primitives; no `components.json` detected. |
| Preset | Not applicable. Do not initialize or import a registry as part of Phase 19 unless separately approved. |
| Component library | Local `src/components/ui/*` primitives backed by Radix where already present. |
| Icon library | `lucide-react`; use existing icons before adding new visual systems. |
| Styling | Tailwind CSS v4 plus CSS custom properties in `src/index.css` and `src/styles/*`. |
| Font | UI: current system sans stack. Editorial display: current `Georgia, Cambria, "Times New Roman", ui-serif, serif` helper unless a later plan explicitly approves a webfont import. |

Registry safety: no third-party registries or blocks are approved for Phase 19.

## Brand Direction

STOA should read as a refined editorial education brand, not a generic SaaS dashboard.

Use:

- Warm editorial neutrals instead of cold blue-grey foundations.
- Burgundy and charcoal as confident education-brand anchors.
- Low-noise surfaces, subtle borders, and restrained shadows.
- Display typography only where the page has public, onboarding, or report character.
- App typography and compact rhythm where users perform repeated tasks.

Avoid:

- Direct homepage clone layouts.
- Blue/teal SaaS dominance.
- Purple gradients, decorative blobs, or abstract software art.
- Uppercase CTAs globally.
- Heavy marketing spacing in chat, dashboards, billing, tutor, support, or admin workflows.

## Color Contract

### 60/30/10 Distribution

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F6F2EC` warm page base | Public/auth/report backgrounds, app page base tint, empty-state backgrounds. |
| Secondary (30%) | `#FCFAF7` surface and `#25211F` charcoal | Cards, forms, sidebars, dark text, selected navigation, report section anchors. |
| Accent (10%) | `#8F2533` derived burgundy | Primary public CTA, selected app nav state, active pricing plan border, teacher-support emphasis, report highlights, focus/ring accents. |
| Destructive | `#B42318` | Destructive actions and destructive errors only. |

Accent reserved for:

- Primary CTA fill on public/auth/pricing surfaces.
- Active route/nav state.
- Primary app action icons where action identity matters.
- Pricing recommended plan border/badge.
- Teacher-support callouts and status icons.
- Parent report highlights and section dividers.
- Focus rings and validation affordances.

Accent is not for every link, every icon, chart decoration, large dashboard backgrounds, or generic card headers.

### Token Values

Phase 109 should introduce or consolidate these CSS variables without deleting existing compatibility tokens until all call sites are verified:

| Token | Hex | Purpose |
|-------|-----|---------|
| `--stoa-brand` | `#8F2533` | Derived burgundy brand action. |
| `--stoa-brand-strong` | `#5E1822` | Hover, pressed, strong report emphasis. |
| `--stoa-brand-soft` | `#F1E1E3` | Pale brand tint for highlights and soft badges. |
| `--stoa-charcoal` | `#25211F` | Primary text, selected app surfaces, dark image overlays. |
| `--stoa-ink` | `#171412` | Highest contrast text and icon color. |
| `--stoa-muted-text` | `#6C625C` | Secondary text; verify contrast on warm backgrounds. |
| `--stoa-page` | `#F6F2EC` | Dominant warm page background. |
| `--stoa-surface` | `#FCFAF7` | Cards, forms, popovers. |
| `--stoa-surface-muted` | `#EFE8DE` | Section bands, app sidebar hover, table row tint. |
| `--stoa-border` | `#D8CEC5` | Subtle borders and separators. |
| `--stoa-focus` | `#8F2533` | Focus-visible rings and keyboard affordance. |
| `--stoa-success` | `#4F6F52` | Calm success; not bright green. |
| `--stoa-warning` | `#9A6A1F` | Calm warning/attention. |
| `--stoa-info` | `#4A6572` | Informational status; not bright blue. |
| `--stoa-destructive` | `#B42318` | Destructive/error only. |

Mapping to Tailwind theme variables:

- `--background`: warm page base.
- `--foreground`: charcoal/ink.
- `--card`: warm white surface.
- `--primary`: derived burgundy or charcoal depending on app readability.
- `--accent`: derived burgundy, not gold/teal.
- `--secondary` and `--muted`: warm neutral family.
- `--border`, `--input`, `--ring`: warm border and burgundy focus.

Do not use exact source homepage CSS files or token names. The values above are a product-token translation.

## Typography

Use exactly two weights in new/changed styling: regular `400` and semibold `600`.

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Label | 12px | 600 | 1.35 | Eyebrows, badges, metadata, form helper labels. |
| Body | 16px | 400 | 1.5 | Marketing copy, reports, form body, empty/error text. |
| UI Compact | 14px | 400 or 600 | 1.45 | Dashboard cards, nav, chat metadata, pricing features. |
| Heading | 24px | 600 | 1.2 | App page titles, card titles, dashboard section headers. |

Display exception:

- Homepage, auth, onboarding, pricing hero, and parent report cover sections may use the existing editorial heading helper and responsive display scale already present in the app.
- Display headings must remain short and balanced. Do not add new long sentence-style hero titles.
- Do not apply editorial display typography inside chat message lists, forms, dense dashboards, billing detail cards, support queues, tutor queues, admin pages, or data tables.

Font rules:

- UI font remains the current system sans stack for speed and dependency stability.
- Editorial helper remains serif fallback inspired by the homepage display rhythm.
- Do not import `/Users/zhdeng/newweb` font CSS.
- If a later implementation adds a web font import, it must be documented as a platform decision and visually QA'd across EN/DE/FR/IT.

## Spacing Scale

Declared values, all multiples of 4:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon/text gaps, tight status metadata. |
| sm | 8px | Compact stack gaps, badge padding, input helper spacing. |
| md | 16px | Default card internal gaps, form groups, app page stacks. |
| lg | 24px | Card padding, app sections, chat input shell, page header spacing. |
| xl | 32px | Public/auth block gaps, dashboard section groups. |
| 2xl | 48px | Public page section breaks, pricing/report major groups. |
| 3xl | 64px | Homepage/auth/report top-level sections on desktop. |

Exceptions:

- Touch targets and icon-only buttons: minimum 44px when possible; never below 40px for existing compact controls.
- Homepage may use up to 80px desktop vertical section rhythm, but do not copy the source website's 120px spacing wholesale.
- Chat must preserve viewport-fit behavior: fixed app shell, scrollable message list, stable input area.
- Mobile horizontal page padding: 16px minimum; public pages may use 20px where already present.

## Shape, Borders, and Shadows

| Element | Contract |
|---------|----------|
| App cards | 8px radius max, 1px warm border, subtle or no shadow. |
| Public/auth cards | 8px radius max, warmer background, soft shadow only for depth. |
| Primary public CTAs | 4px to 8px radius; lower-radius than generic SaaS pills. |
| App buttons | 6px to 8px radius; keep familiar app ergonomics. |
| Badges | 6px radius; avoid oversized pill badges unless used as small metadata. |
| Inputs/textareas/selects | 6px to 8px radius, 1px warm border, clear focus ring. |
| Image containers | 12px max radius unless an existing hero image composition already uses larger radius. |

Remove or reduce generic glossy shadows. Use shadow primarily for layered overlays, auth cards, and pricing/report hierarchy.

## Component Contract

### Buttons

Primary button:

- Background `--stoa-brand`.
- Hover/pressed `--stoa-brand-strong`.
- Text warm white `#FCFAF7`.
- Focus-visible 2px ring using `--stoa-focus` plus offset.
- Disabled keeps visible label and 50-60% opacity; no hidden contrast.
- Pending labels must preserve current behavior and not resize buttons unexpectedly.

Outline button:

- Warm transparent or `--stoa-surface`.
- Border `--stoa-border`.
- Hover background `--stoa-surface-muted`.
- Text `--stoa-charcoal`.

Ghost button:

- No fill by default.
- Hover uses warm neutral, not blue tint.
- Use for secondary nav and low-priority controls only.

Public/auth CTA:

- May use lower radius and slightly wider padding.
- Do not force uppercase globally; only small section labels may be uppercase.
- Icon placement: use lucide icons before/after labels only when it clarifies the command.

### Cards

Default card:

- Warm white surface.
- Subtle warm border.
- 24px padding on desktop; 16px on mobile/compact cards.
- 8px radius.
- No nested card inside card. Use sections, dividers, or list rows instead.

Featured card:

- Use burgundy border or small top rule; avoid large full-card burgundy fill on dashboards.
- Pricing recommended plans can use accent border and soft accent badge.

Report card:

- Parent report cards may use editorial section headers, warm paper surface, and calm dividers.
- Report metadata must stay readable and not become decorative.

### Badges and Status

Status colors:

- Success: calm green `--stoa-success` on pale neutral/green tint.
- Warning: muted ochre `--stoa-warning`.
- Info: muted blue-grey `--stoa-info`.
- Destructive: `--stoa-destructive`.
- Brand/status emphasis: soft burgundy only when the status is brand/action related, not for generic success/error.

Badges must remain readable at 12px and support longer German/French/Italian labels with wrapping or truncation based on context.

### Forms

- Inputs use warm surface and warm border.
- Placeholder text uses muted text with sufficient contrast.
- Focus state uses burgundy ring and no layout shift.
- Error text uses destructive token and includes the existing user-facing recovery path.
- Form layout keeps labels visible; do not replace labels with placeholders.
- Login/register/onboarding cards may feel warmer and more editorial, but form density stays practical.

### Navigation and Logo

- `AppLogo` remains text-based unless a separate asset decision is made.
- Marketing header can carry stronger brand treatment through warm background, charcoal text, and burgundy CTA.
- App sidebar stays product-like: compact, scannable, role-aware.
- Active app nav uses burgundy or charcoal with warm foreground.
- Mobile nav labels must truncate or wrap safely and keep icons visible.

### Chat

- Student bubbles may use brand burgundy or charcoal, but must preserve high contrast.
- Assistant bubbles use warm card surface and border, not decorative color fills.
- Teacher/professional support bubbles use calm professional status treatment, replacing bright emerald with subdued green/neutral styling.
- System messages use muted warm surface.
- Chat input remains fixed at bottom of chat area, with 44px target controls where possible.
- Streaming, stopped, failed, retry, upload, and teacher-support states must remain visually distinct.
- Do not introduce editorial display typography in the message stream.

### Pricing and Billing

- Pricing cards use warm card surfaces, subtle borders, and one clear recommended-plan accent.
- Billing remains operational and product-safe; do not make it a campaign landing page.
- Payment-disabled/preview states must preserve Phase 18 production-facing labels and environment boundaries.
- Billing CTAs must not imply real payment collection where the current environment does not support it.

## Page Adaptation Matrix

| Surface | Brand Strength | Contract |
|---------|----------------|----------|
| Homepage | Strong | Editorial heading rhythm, warm page base, education imagery mood, brand CTA, generous but not cloned spacing. |
| Login | Strong | Trustworthy warm auth card, editorial title, clear form, compact mobile layout. |
| Register/onboarding | Strong | Premium guided flow, warm panels, role cards with restrained icons, no added functionality. |
| Chat | Medium-low | Subtle brand accents, warm bubbles, clear teacher-support states, app-first density. |
| Student dashboard | Medium | Token-aligned cards and headers, practical grid rhythm, restrained progress/accent treatment. |
| Parent dashboard | Medium | Warm service feel, clear child cards, soft upgrade/report cards. |
| Parent report | Strong-medium | Editorial report sectioning, paper-like surface, calm metadata, readable recommendations. |
| Pricing | Strong-medium | Premium comparison surface, accent only for selected/recommended action, clear plan hierarchy. |
| Billing | Medium-low | Operational account surface with brand tokens; preserve payment safety copy. |
| Tutor/support | Medium-low | Token-level consistency, workflow clarity, subdued statuses. |
| Admin/organization/analytics | Low | Token-level consistency only; no deep redesign, no marketing composition. |

## Copywriting Contract

Preserve Phase 17/18 copy safety and multilingual naturalness. Visual work must not reintroduce user-visible `demo`, `mock`, `test`, `Codex`, `development`, `sample`, or internal-rule wording except behind existing developer guards.

| Element | Copy |
|---------|------|
| Primary CTA | `Start learning` |
| Secondary public CTA | `See how it works` |
| Chat empty state heading | `Start your first learning conversation` |
| Chat empty state body | `Ask a question, describe where you are stuck, or upload a worksheet to begin.` |
| Generic empty state heading | `Nothing to show yet` |
| Generic empty state body | `New activity will appear here when this account has learning data.` |
| Generic error state | `We could not load this section. Try again, or contact support if it keeps happening.` |
| Billing unavailable state | `Billing details are not available yet. Learning activity will appear here once the account is active.` |
| Destructive confirmation | No new destructive actions in Phase 19. Preserve existing confirmations; any newly exposed destructive control must use `Confirm {action}` and explain the consequence. |

## Multilingual Stability

Phase 19 must preserve English, German, French, and Italian layout safeguards.

Mandatory rules:

- Keep `min-w-0`, `break-words`, `whitespace-normal`, and responsive wrapping on plan cards, nav items, CTAs, badges, and report rows.
- Preserve German stacked hero support in `src/lib/localeLayout.ts` and `HomeHero`.
- Do not force uppercase on long CTA labels or form actions.
- Do not use viewport-width font scaling.
- Do not use negative letter spacing.
- Buttons with translated labels must use `h-auto`, `min-h-10` or better, and wrapping where labels can become long.
- Pricing feature lists and billing plan names must remain stable in EN/DE/FR/IT.
- Mobile nav must remain usable when labels are longer than English.
- Parent report metadata must wrap instead of overflowing.

Locale QA required in Phase 112:

- EN, DE, FR, IT homepage hero.
- EN, DE, FR, IT login/register.
- EN, DE, FR, IT chat empty and active conversation.
- EN, DE, FR, IT parent dashboard/report.
- EN, DE, FR, IT pricing/billing.

## Accessibility and Interaction Constraints

Phase 20 owns the full accessibility release gate, but Phase 19 must not knowingly regress accessibility.

Required:

- Preserve visible focus states on all buttons, links, inputs, nav items, tabs, dialogs, and dropdown triggers.
- Color contrast target: 4.5:1 for normal text, 3:1 for large text and UI boundaries.
- Do not rely on color alone for status; keep text labels/icons.
- Preserve disabled states and pending states.
- Preserve keyboard interaction from Radix primitives.
- Respect `prefers-reduced-motion`; existing premium reveal/lift effects must stay disabled under reduced motion.
- Avoid layout shifts on hover/focus.
- Keep click/tap targets at least 40px, target 44px for primary mobile controls.

## Phase 109 Implementation Constraints

- Create `docs/design/learning-platform-token-adjustment.md`.
- Add `src/styles/brand-tokens.css`, `src/styles/platform-theme.css`, or equivalent.
- Import new theme files from `src/index.css` after compatibility tokens in a deliberate order.
- Keep `stoa-theme.css` compatibility tokens until all references are migrated or verified.
- Reduce bright blue/teal dominance through tokens, not broad route rewrites.
- No new dependencies.
- No source imports from `/Users/zhdeng/newweb`.

## Phase 110 Implementation Constraints

Refine:

- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- Shared headers/layout/nav/logo surfaces.
- Chat bubbles/input/teacher-support action cards.
- Pricing, billing, parent report, and dashboard cards through shared tokens where possible.

Behavior must remain unchanged.

## Phase 111 Implementation Constraints

Homepage/auth work should:

- Use the strongest editorial brand alignment.
- Keep STOA learning-platform positioning, not company-homepage cloning.
- Preserve current routes, login/register behavior, onboarding steps, language switcher, and environment guards.
- Use education-specific image mood only through existing external/image patterns or newly approved assets; do not copy images from `/Users/zhdeng/newweb`.

## Phase 112 Implementation Constraints

App page work should:

- Keep chat and dashboards app-like, scannable, and repeat-use friendly.
- Apply token-level consistency to tutor/support/admin/organization surfaces without deep redesign.
- Preserve Phase 18 production-facing copy and payment readiness boundaries.
- Create `docs/design/visual-compatibility-qa.md`.
- Update README with Phase 19 source policy and non-copying rule.
- Recheck and document `/Users/zhdeng/newweb` git status without modifying it.

## QA Contract

Required verification evidence for Phase 112:

| Check | Requirement |
|-------|-------------|
| Build | `npm run build` passes after visual changes. |
| Dev server | `npm run dev` status documented, or rationale if not run. |
| Source safety | `/Users/zhdeng/newweb` pre/post status documented; only pre-existing dirty state allowed. |
| No-copy audit | No copied CSS/components/assets from `/Users/zhdeng/newweb`. |
| Brand similarity | Medium-high on homepage/auth/report/pricing. |
| Product independence | High on chat/dashboard/billing/admin. |
| Visual quality | High; no generic blue/teal SaaS dominance. |
| Mobile | P0 pages stable at mobile width. |
| Locale | EN/DE/FR/IT stable for P0 pages. |
| Interaction | Focus, hover, disabled, pending, streaming, upload, retry, and checkout-preview states remain visible. |

Representative routes for QA:

- `/`
- `/login`
- `/register`
- `/onboarding`
- `/chat`
- `/dashboard`
- `/parent`
- `/parent/children/student-anna/report`
- `/parent/children/student-anna/monthly-report`
- `/pricing`
- `/billing`
- `/tutor`
- `/support`
- `/admin`

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | None planned. Local primitives already exist. | Not required. |
| Third-party | None approved. | Blocked unless separately vetted with `shadcn view` and documented flagged-line review. |

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
