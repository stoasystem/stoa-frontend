---
quick_id: 260531-vuu
slug: improve-stoa-scholarship-and-contact-pag
status: in_progress
created: 2026-05-31
---

# Quick Task: Improve Scholarship and Contact Brand Details

## Goal

Use the read-only company site at `/Users/zhdeng/newweb` as the source for STOA logo and contact details, then improve the frontend scholarship/contact surfaces and marketing header/footer.

## Source Facts

- Official logo source: `/Users/zhdeng/newweb/img/logo/logo2.png` and existing copied app asset `img/logo2.png`.
- Official email: `info@stoaedu.ch`.
- Official phone: `+41 78 332 37 96`.
- Official locations: `Zürich · Schindellegi (SZ) · Würenlos (AG)`.
- Company contact form fields: name, email, phone, subject, message.

## Implementation Plan

1. Add a calm `/stipendienprogramm` scholarship page using the provided scholarship-program brief.
2. Add the route and marketing navigation/footer links.
3. Improve the contact page with stronger company identity, direct contact details, and form-context copy.
4. Keep `/Users/zhdeng/newweb` read-only and do not copy page templates or source structure.
5. Verify with lint/build and browser checks for the new scholarship page and contact page.
