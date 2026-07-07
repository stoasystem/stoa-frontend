# v7 Legal Source Notes

**Date:** 2026-07-07
**Status:** Research notes for lawyer-review candidate drafting
**Boundary:** Not legal advice.

## Primary Sources Checked

| Source | Use In v7 |
|--------|-----------|
| Swiss Federal Act on Data Protection (FADP/DSG), Fedlex: https://www.fedlex.admin.ch/eli/cc/2022/491/en | Primary Swiss data-protection law reference. Fedlex requires a JavaScript-capable browser for full reading, so legal review should use the official Fedlex text directly. |
| Federal Data Protection and Information Commissioner (FDPIC): https://www.edoeb.admin.ch/en | Supervisory authority reference. FDPIC states it supervises data-protection matters and protects privacy by ensuring private companies and federal bodies do not process personal data unlawfully. |
| FDPIC Data Protection page: https://www.edoeb.admin.ch/en/data-protection | Official entry point for data-protection supervision, basic knowledge, legal basis, international disclosure, and data-protection services. |
| EU GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj | Primary EU law reference if EU/EEA families, processing, targeting, or cross-border provider questions trigger GDPR relevance. |
| FDFA About Switzerland language reference: https://www.aboutswitzerland.eda.admin.ch/en/language | Confirms Switzerland's multilingual context and four national languages: German, French, Italian, Romansh. |

## Product-Specific Legal Assumptions

These are working assumptions for drafting only:

- STOA supports learning; it does not guarantee grades or outcomes.
- STOA may process student learning activity, uploaded schoolwork materials, support requests, account data, and billing/support metadata.
- Parents receive learning summaries and progress visibility, not a live surveillance feed.
- Teachers/tutors receive enough student context to support a learning request.
- Final processor/subprocessor, retention, payment, hosting, analytics, and support-tool details are not yet confirmed.

## Unknown Facts Required Before Legal Finalization

| Unknown Fact | Why It Matters |
|--------------|----------------|
| Legal entity name | Contracting party, privacy controller, legal notices. |
| Registered address | Privacy and Terms contact details. |
| Privacy contact | User rights and data requests. |
| Hosting region and provider | Cross-border transfer and processor disclosure. |
| Authentication provider | Identity data disclosure. |
| Payment provider | Billing data, refunds, payment processor scope. |
| Analytics/monitoring tools | Cookie and tracking disclosures. |
| Support tooling | Support-message and ticket-data handling. |
| Retention schedule | Privacy notice and deletion rights. |
| Age/guardian policy | Student/minor account terms. |
| Tutor/teacher relationship | Confidentiality, responsibilities, liability boundary. |
| Trial quota and refund policy | Terms and pricing reliability. |
| Governing law and venue | Terms enforceability. |

## v7 Drafting Outcome

The app now has localized `/privacy` and `/terms` candidate copy in the `legal` namespace for EN/DE/FR/IT. The copy is intentionally cautious and marked as lawyer-review draft material.

The current text is suitable for product preview and legal-review preparation. It is not suitable as final public legal text until the unknown facts above are resolved and reviewed.
