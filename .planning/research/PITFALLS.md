# Project Research — Pitfalls For Phase 12

## Scope Pitfalls

- Letting organization UI become production multi-tenant backend design.
- Treating display roles as real permission roles.
- Adding database schemas to support mock organization data.
- Presenting diagnosis/curriculum graph as real AI output.
- Adding heavy graph/chart libraries before the UI proves the need.

## UX Pitfalls

- Platform pages that look like disconnected dashboards rather than one coherent organization workflow.
- Graph UI that overflows or becomes unreadable on mobile.
- Advanced analytics that implies data quality the demo cannot support.
- Partnership onboarding that behaves like a real CRM pipeline.

## Prevention

- Every API is documented as contract/mock only.
- Mock data lives behind typed services.
- All platform pages expose demo mode language in docs, not loud in-product disclaimers.
- Route and E2E smoke tests verify pages render without a backend.
