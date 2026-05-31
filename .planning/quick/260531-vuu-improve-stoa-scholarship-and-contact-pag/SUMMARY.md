---
quick_id: 260531-vuu
slug: improve-stoa-scholarship-and-contact-pag
status: complete
completed: 2026-05-31
---

# Summary: Improve Scholarship and Contact Brand Details

## Completed

- Added `/stipendienprogramm` and `/scholarship-program` public routes for the internal STOA Scholarship Program.
- Used the verified STOA logo asset already copied from `/Users/zhdeng/newweb/img/logo/logo2.png`.
- Added scholarship page content based on the provided brief while clearly stating this is an internal STOA program, not an independent foundation.
- Added scholarship links to the marketing header and footer.
- Improved `/contact` with visible STOA logo, verified phone/email/locations, scholarship CTA, and clearer form-context copy.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- Browser smoke passed for `/stipendienprogramm` and `/contact`: visible STOA logo, `info@stoaedu.ch`, `+41 78 332 37 96`, and scholarship navigation link.
- Mobile browser smoke passed for `/stipendienprogramm` at 390px: no horizontal overflow.
- German browser smoke passed for `/stipendienprogramm`: German title and CTA visible, no horizontal overflow.
