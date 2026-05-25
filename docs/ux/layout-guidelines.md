# Layout Guidelines

Phase 13 layout direction is refined, utilitarian, and product-focused. STOA should feel like a calm learning operations tool: clear hierarchy, restrained surfaces, and obvious next actions.

## Layout Types

| Layout | Use For | Rules |
|--------|---------|-------|
| DashboardLayout | Authenticated role pages | Use for student, parent, tutor, admin, and organization role surfaces. |
| DetailLayout pattern | Detail pages inside DashboardLayout | Add Breadcrumbs, BackButton, and a clear primary action. |
| FormLayout | Login, register, support, onboarding forms | Keep one primary submit action and concise helper text. |
| SplitLayout pattern | Chat, graph, assignment board | Maintain stable pane sizing and avoid input obstruction on mobile. |
| MarketingLayout | Public landing/pricing pages | Keep public acquisition separate from app navigation. |

## Page Structure

Every major page should have:

1. `PageContainer` or established page wrapper.
2. `PageHeader` with an h1 title.
3. Optional description when it clarifies the role task.
4. `PageActions` when there are multiple header actions.
5. Empty/loading/error/success handling when data-backed.

## Detail Pages

Deep pages should include:

- Breadcrumbs when hierarchy matters.
- BackButton when task return matters.
- One primary next action.
- Related links only after the primary action is clear.

## Component Use

Use existing common primitives before adding new ones:

- `PageContainer`
- `PageHeader`
- `SectionHeader`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `PageSkeleton` / `Skeleton`
- `RoleBadge`
- `Badge`
- `Button`

## Placeholder and Demo Treatment

Demo or placeholder pages must say so in their page description or content. They should not imply production backend, AI diagnosis, payment processing, organization permissions, or tutor matching is live.
