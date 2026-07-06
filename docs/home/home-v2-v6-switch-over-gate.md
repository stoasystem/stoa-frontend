# Home V2 v6 Switch-Over Gate

**Date:** 2026-07-06
**Decision:** `/home-v2` must not replace `/` until these gates pass.

## Gate 1: Final Public Assets

- Final Hero image is purchased or commissioned.
- Final Parent Confidence image is purchased or commissioned.
- Usage rights and releases are documented.
- Asset ledger is updated.
- Web-ready variants are generated.

## Gate 2: Runtime Locale Decision

- Decide whether Home V2 public launch supports EN/DE only or EN/DE/FR/IT.
- If FR/IT are included, register runtime resources and test them.
- Confirm layout fit for all launch locales.

## Gate 3: SEO And Routing

- Define route replacement plan for `/`.
- Preserve old homepage route or archive path if needed.
- Update canonical tags, sitemap, metadata, and internal links.
- Confirm no broken nav or auth routes.

## Gate 4: QA

- Run `npm run lint`.
- Run `npm run build`.
- Run Home V2 E2E.
- Capture desktop and mobile screenshots after final assets.
- Check nav, menu, Login, CTAs, section anchors, and reduced-motion behavior.

## Gate 5: Rollback And Monitoring

- Define rollback path to old `/`.
- Record deployment checklist.
- Confirm basic monitoring/logging expectations.
- Prepare post-launch visual issue triage list.

## Gate 6: Explicit Approval

- User approval for final images.
- User approval for final copy.
- User approval for replacing `/`.

## Not Part Of v6

The gates above belong to the next program. v6 completed the design/procurement track and intentionally did not perform the switch.
