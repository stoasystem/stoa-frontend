# Requirements: v9 Home V2 Final Issue Cleanup

## Core Value

v9 must clear the concrete blockers found in v8 so `/home-v2` can move from visual preview to switch-over planning. It must fix layout and presentation issues, document image approval status, add basic SEO metadata, preserve the current `/` route, and verify the result with browser evidence.

## Requirements

### Scope And Acceptance

- [x] **SCOPE-01**: Keep the current `/` homepage unchanged.
- [x] **SCOPE-02**: Treat `/home-v2` as the cleanup target and future switch-over candidate only.
- [x] **SCOPE-03**: Use `docs/home-v2/v8-go-no-go-register.md` as the v9 backlog source.
- [x] **SCOPE-04**: Produce a clear v9 acceptance contract and final readiness decision.

### Responsive And Visual Fixes

- [x] **LAYOUT-01**: Fix FR mobile horizontal overflow caused by long Hero copy.
- [x] **LAYOUT-02**: Improve FR/IT long-title fit on desktop and mobile.
- [x] **LAYOUT-03**: Reduce mobile Hero image dominance while keeping the premium photography frame.
- [x] **LAYOUT-04**: Check final CTA overflow and long-copy resilience.
- [x] **LAYOUT-05**: Make Home V2 desktop navigation labels more visible without redesigning the header.

### Legal Page Presentation

- [x] **LEGAL-01**: Remove visible page-facing draft / lawyer-review / candidate framing from `/privacy` and `/terms`.
- [x] **LEGAL-02**: Keep legal pages as complete internal-test drafts without claiming legal finality.
- [x] **LEGAL-03**: Preserve unresolved legal facts in internal documentation instead of public page copy.
- [x] **LEGAL-04**: Verify legal pages render in EN/DE/FR/IT.

### SEO, Routing, And Switch Planning

- [x] **SEO-01**: Replace the generic `STOA Frontend` document title with product-appropriate default metadata.
- [x] **SEO-02**: Add route-level title/meta support for `/home-v2`, `/privacy`, and `/terms`.
- [x] **SEO-03**: Document canonical, sitemap, old-home preservation, and rollback requirements for a future switch-over.
- [x] **SEO-04**: Do not switch `/home-v2` to `/` in v9.

### Image Approval

- [x] **ASSET-01**: Record current Hero and Parent Confidence images as `temporary-public-approved`, not final-public-approved.
- [x] **ASSET-02**: Keep final paid/commissioned imagery as a later requirement before broad public marketing.
- [x] **ASSET-03**: Do not add paid previews, watermarked images, or new unlicensed binaries.

### Verification

- [x] **VERIFY-01**: Re-run screenshot/layout QA for `/home-v2` in EN/DE/FR/IT desktop and mobile.
- [x] **VERIFY-02**: Re-run legal render checks for `/privacy` and `/terms` in EN/DE/FR/IT.
- [x] **VERIFY-03**: Run lint, build, and Home V2 relevant E2E checks.
- [x] **VERIFY-04**: Store raw screenshots and machine evidence under `/private/tmp/stoa-home-v2-v9/`, not the repository.

## Out Of Scope

- Replacing `/` with `/home-v2`.
- Final legal advice or lawyer sign-off.
- Buying stock assets or commissioning photography.
- Reworking the Home V2 information architecture.
- Adding runtime Romansh support.
- Committing screenshot binaries.

## Traceability

| Requirement | Phase |
|-------------|-------|
| SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04 | 298 |
| LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05 | 299 |
| LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04 | 300 |
| SEO-01, SEO-02, SEO-03, SEO-04, ASSET-01, ASSET-02, ASSET-03 | 301 |
| VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04 | 302 |
| SCOPE-04 | 303 |
