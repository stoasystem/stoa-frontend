# v7 Privacy And Terms Research Plan

**Date:** 2026-07-07
**Status:** Planning handoff
**Boundary:** This is not legal advice. It is a research and drafting plan for lawyer-review candidate privacy and terms text.

## Goal

v7.6 should produce privacy and terms material that is close enough for counsel or a qualified legal reviewer to review efficiently. The output should be practical for a Swiss education product, but it must not claim final compliance.

## Primary Legal Sources To Review

Use official or primary sources first:

- Swiss Federal Act on Data Protection (FADP/DSG): https://www.fedlex.admin.ch/eli/cc/2022/491/en
- Swiss Federal Data Protection and Information Commissioner (FDPIC): https://www.edoeb.admin.ch/edoeb/en/home.html
- EU General Data Protection Regulation (GDPR): https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Swiss federal law portal for constitutional/language checks: https://www.fedlex.admin.ch/
- Swiss language background reference: https://www.aboutswitzerland.eda.admin.ch/en/language

Secondary sources may be used only to interpret implementation implications. Final wording should trace back to primary sources or legal review.

## Research Questions

### Privacy

- What personal data does STOA collect from students, parents, teachers/tutors, and admins?
- Which data is necessary for learning support, account management, billing, and support?
- What data involves minors or education context?
- Is STOA acting as controller, processor, or both in different scenarios?
- Which processors/subprocessors are used or expected?
- Where is data stored and processed?
- What retention periods apply or should be proposed?
- What rights should users be told about?
- What contact method should users use for privacy requests?
- Is GDPR triggered by EU/EEA families, cross-border users, or processor locations?
- What cookies, analytics, or tracking technologies exist?

### Terms

- What is the offered service in plain legal language?
- What is the boundary between Learning Assistant support and human teacher/tutor support?
- What does STOA not promise?
- What usage is prohibited?
- What are account responsibilities for parents, students, teachers/tutors, and admins?
- What are the free trial quota rules?
- What subscription, cancellation, refund, and billing terms are needed?
- What happens when a paid plan expires or quota is exceeded?
- What liability and educational-outcome boundaries are needed?
- What governing law and jurisdiction should apply?

### Children And Education Context

- What parent/guardian consent assumptions are made?
- What can parents see about student learning activity?
- How is transparency framed without implying surveillance?
- What student content may be uploaded?
- How are photos/PDFs/homework materials handled?
- What should users avoid uploading?

## Required Unknown Facts

These facts must be collected before final legal text can be operationally reliable:

| Fact | Needed For |
|------|------------|
| Legal company name | Privacy policy and Terms contracting party |
| Registered address | Privacy contact, Terms, imprint-like information |
| Privacy contact email | User rights and support handling |
| Data hosting location | Cross-border transfer and privacy notice |
| Backend provider list | Processor/subprocessor disclosure |
| Authentication provider | Account and identity data disclosure |
| Payment provider | Billing, subscription, refund, payment data scope |
| Analytics tools | Cookie/analytics disclosure |
| Support/ticket tools | Support data disclosure |
| Retention periods | Privacy policy and deletion rights |
| Age/guardian policy | Minor/student account terms |
| Tutor/teacher employment or contractor model | Terms, confidentiality, accountability |
| Trial quota rules | Terms and pricing copy |
| Refund policy | Terms and checkout copy |
| Governing law and venue | Terms |

## Draft Outputs For v7.6

v7.6 should create:

- EN privacy source draft.
- EN terms source draft.
- DE candidate privacy translation.
- DE candidate terms translation.
- FR candidate privacy translation.
- FR candidate terms translation.
- IT candidate privacy translation.
- IT candidate terms translation.
- review markers for unresolved facts.
- legal risk notes.
- source-reference notes.
- user-facing short summaries where appropriate.

## Drafting Rules

- Mark unresolved facts clearly, for example: `[LEGAL-REVIEW: confirm hosting location]`.
- Do not invent company details.
- Do not promise data practices that are not implemented.
- Do not claim compliance certification.
- Do not claim legal review happened until it actually has.
- Do not bury important user rights in marketing language.
- Use product terms from the v7 glossary unless a legal term needs more precision.

## Privacy Topics To Cover

- identity and account data
- parent/student/tutor/admin roles
- uploaded materials
- learning activity and progress data
- chat/classroom/practice interaction data
- billing and subscription data
- support communications
- analytics and cookies
- legal basis or justification language
- processors/subprocessors
- international transfers, if any
- retention and deletion
- user rights
- minors/guardian involvement
- contact details

## Terms Topics To Cover

- service description
- eligibility and accounts
- parent/student responsibilities
- teacher/tutor support boundaries
- Learning Assistant boundary and no guaranteed outcome
- acceptable use
- uploaded content rights and restrictions
- subscriptions, trial quota, cancellation, refunds
- service availability
- limitation of liability
- termination
- governing law and disputes
- changes to terms
- contact

## Translation Quality

Legal translations must be treated differently from marketing translations:

- EN source should be the controlled master unless counsel requires another source language.
- DE/FR/IT should be candidate legal translations, not automatic UI translations.
- Each locale should preserve legal precision over elegance.
- Counsel or qualified legal translator review is required before public reliance.

## Completion Criteria

v7.6 is complete only when:

- primary-source research notes exist.
- unknown facts are listed.
- EN privacy and terms source drafts exist.
- DE/FR/IT candidate legal translations exist.
- unresolved legal review markers are visible.
- the docs clearly state that legal review remains required.
