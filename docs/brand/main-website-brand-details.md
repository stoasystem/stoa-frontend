# Main Website Brand Details

**Phase:** Phase 21
**Source path:** `/Users/zhdeng/newweb`
**Access mode:** read-only
**Date:** 2026-05-26

## Read-Only Confirmation

Pre-work status observed in `/Users/zhdeng/newweb`:

```text
 M img/team/.DS_Store
```

This modification existed before Phase 21 work and was not created by the learning-platform project. The source project is not modified by this milestone.

Read-only files inspected:

- `index.html`
- `contact.html`
- `js/include-header-footer.js`
- `js/ajax-form.js`
- `js/language-switcher.js`
- logo file metadata under `img/logo/`

No formatter, install, build, delete, move, rename, or write command was run in `/Users/zhdeng/newweb`.

## Footer Information Found

The main website footer exposes:

- STOA brand name and logo.
- Short education-focused footer description.
- Links to home, about/team, programs, contact, and FAQ.
- Contact section with email, phone, and locations.
- Copyright line for STOA 2025.
- Placeholder social links with `#` targets.

Reusable factual details:

| Detail | Value |
| --- | --- |
| Email | `info@stoaedu.ch` |
| Phone | `+41 78 332 37 96` |
| Locations | `Zürich · Schindellegi (SZ) · Würenlos (AG)` |
| Contact link pattern | `contact.html#contact` on the main website |
| Copyright | STOA 2025 |

## Contact Information Found

The contact page presents three contact cards:

- Phone support: `+41 78 332 37 96`
- Email address: `info@stoaedu.ch`
- Office address / locations: `Zürich, Schindellegi (SZ), Würenlos (AG)`

The page also includes an embedded map. The learning platform should not embed the same map by default in Phase 21 because the platform footer/contact page should stay lighter and app-oriented.

## Logo Usage Observed

Observed logo files:

| File | Metadata |
| --- | --- |
| `img/logo/logo.png` | PNG, 373 x 208, RGBA |
| `img/logo/logo2.png` | PNG, 359 x 195, RGBA |
| `img/logo/f_logo.png` | PNG, 414 x 72, RGBA |
| `img/logo/logo(old).png` | PNG, 414 x 72, RGBA |
| `img/features/circlelogo.png` | PNG, 128 x 128, RGBA |

Usage pattern:

- Header uses logo image links to the homepage.
- Footer uses logo image in the copyright section.
- Logo appears on both light and footer/dark-ish contexts through different files.

Learning-platform adaptation:

- Do not copy these image files.
- Use a local `StoaLogo` component that renders text/mark-like STOA identity using existing platform theme colors.
- Provide dark, light, gold, and monochrome variants to keep contrast stable.

## Contact Form Structure Observed

The main website contact form includes:

- first name / name field
- email field
- phone field
- subject select
- message textarea
- submit button
- inline AJAX response area

Observed subject options:

- General inquiry
- Enrollment
- Program information
- Other
- Job application

Observed behavior:

- Required name, email, phone, and message validation.
- Email format validation.
- Swiss phone normalization and validation.
- Duplicate-submit guard through `isSubmitting`.
- Disabled submit button while pending.
- Success and error messaging in the response area.
- EmailJS frontend sending in the homepage project.

Learning-platform adaptation:

- Keep the product-relevant structure and state behavior.
- Do not use EmailJS or production email sending.
- Use the Phase 21 frontend/demo API contract `POST /contact/requests`.
- Expand role/topic options for the learning platform context.

## What To Reuse Directly As Information

- Email: `info@stoaedu.ch`
- Phone: `+41 78 332 37 96`
- Locations: `Zürich · Schindellegi (SZ) · Würenlos (AG)`
- Contact-form idea: name, email, phone, topic, message, submit state, success/error state

## What To Adapt Visually

- Footer should be more compact than the marketing homepage footer.
- Footer should use learning-platform surfaces, typography, and restrained border treatments.
- Logo should be rendered through the platform component and themed colors.
- Contact page should feel like a product support/contact surface, not a copied marketing page.

## What Not To Copy

- Do not copy homepage HTML structures.
- Do not copy image assets into `stoa-frontend`.
- Do not copy EmailJS configuration or frontend email sending.
- Do not copy placeholder social links.
- Do not copy the embedded map unless a future product decision requires it.

## Learning Platform Implementation Plan

1. Create reusable brand/contact constants in the learning platform.
2. Add `StoaLogo` with theme-safe variants.
3. Add `AppFooter`, `FooterContactInfo`, and `FooterLegalLinks`.
4. Add localized footer/contact labels in `common` and contact-page namespace files.
5. Add `/contact` route and a contact form that follows the observed structure.
6. Define `POST /contact/requests` service contract.
7. Add pending, success, error, validation, and retry behavior.
8. Document accessibility, QA, and release-gate checks in later Phase 21 phases.

## Post-Work Source Status

Post-work status observed in `/Users/zhdeng/newweb`:

```text
 M img/team/.DS_Store
```

No Phase 21 source audit step modified `/Users/zhdeng/newweb`.

