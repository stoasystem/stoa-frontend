---
plan_id: 105-01
phase: 105
phase_name: Production Copy Cleanup and Display Label Mapping
status: planned
---

# Plan 105-01: Copy and Label Boundary

## Goal

Clean rendered product copy and add reusable status/error mapping boundaries.

## Tasks

1. Add `src/lib/displayLabels.ts`.
2. Add `src/components/common/SafeStatusLabel.tsx`.
3. Add `src/lib/userFacingText.ts`.
4. Update EN/DE/FR/IT status label keys.
5. Replace raw support, teacher-help, subscription, attachment, learning topic, and admin feedback status renders.
6. Rewrite auth/register, billing, pricing, home, admin, support, organization, learning, referral, and checkout visible copy away from demo/mock/placeholder language.
7. Verify build.

## Verification

- `npm run build` passes.
- Scan confirms remaining demo/mock/placeholder matches in `src/i18n`, `src/pages`, and `src/components` are key names, internal imports, placeholders as HTML attributes, gated debug UI, or internal analytics identifiers.
