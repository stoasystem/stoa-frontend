# Page Entry / Exit Audit

| Page | Entry Points | Primary Action | Exit Points | Dead-End Risk | Treatment |
|------|--------------|----------------|-------------|---------------|-----------|
| `/dashboard` | Login redirect, student nav | Start/continue chat | `/chat`, `/learning-history`, `/profile` | Low | Keep Chat CTA prominent. |
| `/chat` | Dashboard, student nav | Ask question/request teacher | Dashboard, history | Medium | Ensure nav remains available; mobile bottom nav must not cover input. |
| `/parent` | Login redirect, parent nav | Select child | Child summary, billing, support | Low | Child cards are primary entry. |
| `/parent/children/:childId` | Parent child card | Review child summary | Weekly report, history, parent overview | Medium | Added breadcrumb/back. |
| `/parent/children/:childId/report` | Child summary, parent report card | Review recommendations | Monthly report, child summary, billing/support | Medium | Added breadcrumb/back and monthly report CTA. |
| `/parent/children/:childId/monthly-report` | Weekly report, learning profile demo | Review month-level progress | Weekly report, child summary, billing/support | Medium | Added breadcrumb/back and weekly report CTA. |
| `/tutor` | Login redirect, tutor nav | Open request | Request detail, availability | Low | Request list drives flow. |
| `/tutor/requests/:requestId` | Tutor request list | Update status/add note | Requests | High | Added breadcrumb and BackButton. |
| `/admin` | Login redirect, admin nav | Choose operational area | Usage, help requests, support | Medium | Keep overview focused. |
| `/admin/support/:ticketId` | Support inbox | Update status | Support inbox, help requests | High | Added breadcrumb/back. |
| `/pricing` | Landing, report/billing CTAs | Compare/upgrade | Register, billing, support | Low | Public conversion route. |
| `/billing` | Parent nav, pricing/report CTAs | Upgrade/manage billing | Pricing, support, dashboard | Low | Keep primary upgrade CTA. |
| `/referrals` | Parent nav, growth CTAs | Share invite | Register/support | Low | Parent secondary path. |
| `/support/tickets` | Support page | Open ticket | Ticket detail, support | Medium | Keep support page return. |
| `/support/tickets/:ticketId` | Ticket list | Read status | Ticket list, support | Medium | Added breadcrumb/back. |
| `/organization` | Organization role home | Open students/tutors/reports | Students, tutors, reports, analytics | Low | Organization-mode only. |
| `/organization/students/:studentId/learning-profile` | Organization students | Review learning profile | Students, diagnosis, graph | Medium | Breadcrumb/back needed through shared learning profile component. |
| `/students/:studentId/learning-profile` | Demo/dashboard/report context | Review learning profile | Diagnosis, graph, reports | Medium | Added breadcrumb/back to organization students. |
| `/students/:studentId/diagnosis` | Learning profile | Review diagnosis | Graph, learning profile | Medium | Added breadcrumb/back. |
| `/students/:studentId/curriculum-graph` | Learning profile/diagnosis | Explore graph | Diagnosis, learning profile | Medium | Added breadcrumb/back. |

## Dead-End Rule

Any second-level or detail route must include at least one of:

- Back button
- Breadcrumb
- Primary next-step CTA
- Related link
- Return to role dashboard
