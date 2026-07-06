# Home V2 v6.5 Photography Approval Workflow

**Date:** 2026-07-06

## Workflow

1. Candidate intake
   - Add source or shoot select to the review ledger.
   - Record source URL, license URL, creator/vendor, release status, and role.

2. Legal/source screen
   - Reject unclear license, missing minor release, watermark, visible school logo, private data, or trademark risk.

3. Visual screen
   - Score Swiss parent fit, premium fit, learning story, crop fit, and overlay fit.
   - Reject generic tutoring stock, surveillance posture, or technology-dominant story.

4. Page-fit screen
   - Test Hero against tall desktop and mobile landscape.
   - Test Parent Confidence against note overlay and mobile crop.

5. Approval decision
   - Approved final.
   - Approved temporary.
   - Needs paid purchase.
   - Needs commissioned replacement.
   - Rejected.

6. Implementation intake
   - Copy approved final files into a future implementation branch.
   - Generate optimized variants.
   - Wire only `/home-v2`.
   - Verify `/` remains unchanged until switch-over milestone.

## Approval Gates

Final public approval requires:

- Clear usage rights.
- Release status resolved for identifiable people/minors.
- No endorsement risk.
- Strong Swiss parent fit.
- Strong crop/page fit.
- No high-risk visual mismatch.

## Future Implementation Checklist

- Add final source files to `img/home-v2/final-source/` or equivalent approved location.
- Generate `preview` or production-ready JPEG/WebP/AVIF variants.
- Update `HomeV2Hero.tsx` and/or `HomeV2ParentConfidence.tsx` only after final files exist.
- Update asset ledger with final approval state.
- Run lint/build/Home V2 E2E.
- Capture desktop/mobile screenshots.
- Do not replace `/` in the same milestone unless explicitly planned.
