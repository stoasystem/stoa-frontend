# Phase 118: Brand Detail Read-Only Audit and Integration Plan - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Auto-generated from roadmap and read-only source inspection

<domain>
## Phase Boundary

Extract company footer, contact, logo, and contact-form details from `/Users/zhdeng/newweb` in read-only mode and define the learning-platform adaptation boundary.

</domain>

<decisions>
## Implementation Decisions

- `/Users/zhdeng/newweb` remains strictly read-only.
- Phase 118 may record factual contact information and abstract structure, but must not copy homepage components or assets into the learning platform.
- The learning platform should adapt brand details into its existing product-app theme.

</decisions>

<code_context>
## Existing Code Insights

- Company homepage footer/contact observations are recorded from `index.html`, `contact.html`, `js/include-header-footer.js`, and `js/language-switcher.js`.
- Source status before Phase 118 remains `M img/team/.DS_Store`, a pre-existing modification not created by STOA frontend work.

</code_context>

<specifics>
## Specific Ideas

- Reuse factual information: `info@stoaedu.ch`, `+41 78 332 37 96`, and locations `Zürich · Schindellegi (SZ) · Würenlos (AG)`.
- Adapt contact form structure: name, email, phone, subject/topic, message, validation, disabled pending state, and success/error messaging.
- Adapt logo usage through a local `StoaLogo` component rather than copying image files.

</specifics>

<deferred>
## Deferred Ideas

- Production email delivery and CRM integration are deferred.
- Exact social links are not integrated because homepage links are placeholder `#` values.

</deferred>

