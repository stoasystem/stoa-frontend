# Requirements: STOA Frontend v3.1

**Defined:** 2026-07-03
**Core Value:** STOA can move from image strategy to a concrete Home V2 candidate pool with licensed, high-end, traceable assets that can later be inserted into the separate `/home-v2` preview route.

## v3.1 Requirements

### Search And Source Screening

- [x] **ASSET-01**: Home V2 has a searched candidate pool for Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA.
- [x] **ASSET-02**: Every candidate records source type, source URL, download URL when applicable, creator/vendor, and search context.
- [x] **ASSET-03**: Free-source candidates are screened against Pexels license constraints, including endorsement, negative portrayal, redistribution, trademark, and public website use.
- [x] **ASSET-04**: Paid or ambiguous sources remain approval-gated and are not downloaded unless license, purchase, and final-use rights are clear.

### Visual Scoring And Shortlist

- [x] **ASSET-05**: Every shortlisted asset is scored for authenticity, Swiss-parent fit, learning relevance, crop flexibility, diversity/age fit, brand fit, and risk.
- [x] **ASSET-06**: The shortlist applies the v2.7 high-end visual direction: Editorial Luxury, Editorial Split, double-bezel image framing, calm family learning, and 70/30 education/product balance.
- [x] **ASSET-07**: Each Home V2 section has a recommended primary or backup candidate with notes on crop and visual role.
- [x] **ASSET-08**: Rejected or deferred candidates have a clear reason, such as weak Swiss fit, staged stock feel, AI/Canva adjacency, paid-watermark restriction, or brand/endorsement risk.

### Download And Metadata

- [x] **ASSET-09**: Suitable free, traceable candidates are downloaded into a Home V2 candidate namespace.
- [x] **ASSET-10**: Downloaded files are stored separately from current homepage assets and use descriptive names including source and asset ID.
- [x] **ASSET-11**: A metadata ledger captures local path, source page, license URL, creator/vendor, section role, approval state, AI/enhancement state, and risk notes.
- [x] **ASSET-12**: Downloaded candidate files are verified for image type, dimensions, and basic repository hygiene before commit.

### Handoff And Next Scope

- [x] **ASSET-13**: The milestone produces a Home V2 image shortlist document ready for later asset insertion.
- [x] **ASSET-14**: The handoff distinguishes local downloadable candidates from paid/source-gated candidates.
- [x] **ASSET-15**: Current `/`, React components, localized JSON, routing, and production homepage behavior remain unchanged.
- [x] **ASSET-16**: The next milestone can choose final assets, crop/optimize variants, add alt text, and implement Home V2 without reopening source strategy.

## Future Requirements

| Requirement | Reason Deferred |
|-------------|-----------------|
| Buying iStock assets | Requires explicit budget and purchase approval. |
| Using Magnific stock/API assets | Requires account access and clearer stock/provenance workflow. |
| Final crop variants and WebP/AVIF generation | Belongs to the asset insertion or implementation milestone. |
| React Home V2 implementation | Requires component scaffolding and visual QA. |
| Final localized alt text and adjacent copy | Belongs to copy/localization and implementation. |
| Switching `/` to Home V2 | Requires explicit later approval after route, assets, copy, and screenshots are reviewed. |

## Out of Scope

| Item | Reason |
|------|--------|
| Replacing the current homepage route `/` | v3.1 collects assets only. |
| Building Home V2 React components | This milestone is candidate search and shortlist. |
| Purchasing paid stock | iStock and other paid assets require explicit approval. |
| Downloading iStock watermarked comps for public/final use | iStock limits watermarked content to test/sample layout use only. |
| Using AI-generated family/child hero imagery | User prefers avoiding AI generation, and family/child AI imagery is high trust-risk. |
| Claiming model or property release safety beyond source license notes | Release confidence needs source/platform confirmation before final public use. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ASSET-01 | 240 | Complete |
| ASSET-02 | 240 | Complete |
| ASSET-03 | 240 | Complete |
| ASSET-04 | 240 | Complete |
| ASSET-05 | 241 | Complete |
| ASSET-06 | 241 | Complete |
| ASSET-07 | 241 | Complete |
| ASSET-08 | 241 | Complete |
| ASSET-09 | 242 | Complete |
| ASSET-10 | 242 | Complete |
| ASSET-11 | 242 | Complete |
| ASSET-12 | 242 | Complete |
| ASSET-13 | 243 | Complete |
| ASSET-14 | 243 | Complete |
| ASSET-15 | 243 | Complete |
| ASSET-16 | 243 | Complete |

**Coverage:**
- v3.1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 after v3.1 candidate image search and shortlist execution*
