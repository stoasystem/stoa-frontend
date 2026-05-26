# Phase 32 Global Copy Audit Matrix

| Route | Component | Key / Source | English | German | French | Italian | Meaning accurate | Tone appropriate | UI fits | No forbidden terms | Approved | Notes |
|-------|-----------|--------------|---------|--------|--------|---------|------------------|------------------|---------|--------------------|----------|-------|
| `/` | Home hero / flow / Practice entry | `home.json` | Reviewed | Reviewed | Reviewed | Reviewed | Yes | Yes | Passed smoke | Yes | Yes | Changed English `prompt` wording to `hint`; German/French/Italian reviewed for natural structure. |
| `/login` | Login form | `auth.login.*` | Reviewed | Reviewed | Reviewed | Reviewed | Yes | Yes | Passed smoke | Yes | Yes | Replaced visible `demoTitle` key/copy with review-account language; gated account shortcuts remain non-production. |
| `/register` | Register form | `auth.register.*` | Reviewed | Reviewed | Reviewed | Reviewed | Yes | Yes | Passed smoke | Yes | Yes | Account-type wording remains clear; teacher application review copy is product-facing. |
| `/pricing` | Pricing page | `pricing.json`, `pricingPlans.ts` | Reviewed | Reviewed | Reviewed | Reviewed | Yes | Yes | Passed smoke | Yes | Yes | Pricing FAQ remains on `/qa`; plan labels reviewed for family/teacher clarity. |
| `/billing` | Billing page | `billing.json` | Reviewed | Reviewed | Reviewed | Reviewed | Yes | Yes | Passed smoke | Yes | Yes | Renamed user-facing i18n keys from mock checkout wording to plan-selection review wording. |
| `/billing/checkout/*` | Plan selection review | `VirtualCheckoutPage`, `CheckoutResultPage` | Reviewed | N/A | N/A | N/A | Yes | Yes | Passed build | Yes | Yes | Replaced plan preview wording with plan review wording. |
| `/practice` | Practice overview | component copy | Reviewed | N/A | N/A | N/A | Yes | Yes | Passed smoke | Yes | Yes | Removed visible demo-path language. |
| `/practice/*/lessons/*/result` | Lesson result | component copy | Reviewed | N/A | N/A | N/A | Yes | Yes | Passed build | Yes | Yes | Removed student-demo-flow language. |
| `/chat` | Learning Chat | `chat.json` | Reviewed | Reviewed | Reviewed | Reviewed | Yes | Yes | Passed smoke | Yes | Yes | Error/upload/teacher request copy rewritten into user-friendly language. |
| `/parent/*/report` | Parent report | `parent.json`, components | Reviewed | Reviewed | Reviewed | Reviewed | Yes | Yes | Passed smoke | Yes | Yes | Parent language remains progress-focused, not surveillance-focused. |
| `/tutor/requests/*` | Tutor request detail | component copy | Reviewed | N/A | N/A | N/A | Yes | Yes | Passed smoke | Yes | Yes | Practice context and teacher request copy use student-support wording. |
| `/qa` | Q&A page | `qaContent.ts` | Reviewed | N/A | N/A | N/A | Yes | Yes | Passed smoke | Yes | Yes | Categorized Q&A remains standalone and product-facing. |
| legacy stub files | Student/parent/teacher old pages | `src/pages/{student,parent,teacher}` | Reviewed | N/A | N/A | N/A | Yes | Yes | N/A | Yes | Yes | Replaced TODO placeholder text with safe directional text. |

## Notes

- This matrix records the Phase 32 audit baseline and fixes made during the milestone.
- Internal implementation identifiers such as `mock*` data helpers, demo fallback services, route metadata statuses, and hidden debug labels are tracked in `docs/qa/development-artifact-audit.md` rather than treated as visible copy failures.
- Visual fit evidence is recorded in `docs/language/final-language-qa-report.md`.
