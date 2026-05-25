# Project Research — Pitfalls For Phase 12

**Updated:** 2026-05-25
**Mode:** Research-first update after Phase 12 milestone approval

## Scope Pitfalls

- Letting organization UI become production multi-tenant backend design.
- Treating display roles as real permission roles.
- Adding database schemas to support mock organization data.
- Presenting diagnosis/curriculum graph as real AI output.
- Adding heavy graph/chart libraries before the UI proves the need.
- Implementing tutor assignment as an algorithm instead of rendering suggestions from contract data.
- Computing retention/cohort analytics from raw frontend events instead of rendering aggregated mock/API data.

## UX Pitfalls

- Platform pages that look like disconnected dashboards rather than one coherent organization workflow.
- Graph UI that overflows or becomes unreadable on mobile.
- Advanced analytics that implies data quality the demo cannot support.
- Partnership onboarding that behaves like a real CRM pipeline.
- Large metric/card grids that bury the user's primary action.
- Monthly report pages that duplicate weekly report content without expressing monthly trends.

## Prevention

- Every API is documented as contract/mock only.
- Mock data lives behind typed services.
- All platform pages expose demo mode language in docs, not loud in-product disclaimers.
- Route and E2E smoke tests verify pages render without a backend.
- Keep frontend calculations shallow: formatting, filtering, and selection only.
- Use stable dimensions for graphs/charts so mobile and desktop layouts do not shift or overflow.
- Track only page, org, student, subject, and topic identifiers; never full chat/support/report content.
