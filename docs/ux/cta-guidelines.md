# CTA Guidelines

Phase 13 standardizes action hierarchy so every page answers: what is the most important next step?

## CTA Types

| Type | Meaning | Styling |
|------|---------|---------|
| Primary | The main page action | `Button` default variant |
| Secondary | Useful supporting action | `Button` outline/secondary |
| Tertiary | Low-pressure navigation or reference | ghost/link/text link |
| Danger | Destructive or irreversible action | destructive variant |

## Role Examples

| Page | Primary | Secondary | Tertiary |
|------|---------|-----------|----------|
| Student Dashboard | Start / continue chat | View learning history | Edit profile |
| Chat | Send message | Request teacher help | Return to dashboard |
| Parent Report | View recommendations / monthly report | Open billing | Contact support |
| Billing | Upgrade plan | Manage billing | Contact support |
| Tutor Request Detail | Mark resolved | Add note / back to requests | View request context |
| Admin Overview | Open help requests/support | View usage | Advanced analytics demo |
| Organization Students | Open learning profile | View reports | Tutor assignment demo |

## Rules

1. Do not place two unrelated primary CTAs in the same header.
2. Use the same verb for the same action across pages.
3. Prefer route-specific labels: `Back to requests`, `Child summary`, `Support inbox`.
4. Do not style placeholder or demo actions as if they perform production work.
5. Destructive actions must never be tertiary text links.

## PageActions

Use `PageActions` when a header needs more than one action. Order by weight: tertiary, secondary, danger, primary. This keeps the primary action visually last and easy to scan.
