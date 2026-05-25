# Page Inventory

Phase 13 source of truth for STOA frontend pages. Status values: `core`, `demo`, `placeholder`, `duplicate`, `hidden`, `deprecated`. Priority values: P0 core path, P1 important support path, P2 demo/future path, P3 hidden/low priority.

| Route | Page | Role | Module | Purpose | Entry points | Exit points | Status | Priority | Notes |
|-------|------|------|--------|---------|--------------|-------------|--------|----------|-------|
| `/` | HomePage | public | Public | App landing and top-level entry. | Direct, public links | Login, register, pricing | core | P1 | App-owned for now; marketing may move later. |
| `/login` | LoginPage | public | Auth | User sign-in. | Public nav, protected redirect | Role home | core | P0 | Required app route. |
| `/register` | RegisterPage | public | Auth | Account creation. | Public nav, pricing/referral | Role home/login | core | P1 | Referral code can land here. |
| `/forgot-password` | ForgotPasswordPage | public | Auth | Password recovery placeholder. | Login | Login | placeholder | P2 | Keep out of main nav. |
| `/pricing` | PricingPage | public | Billing | Plan comparison. | Landing, parent report, billing CTAs | Billing, register | core | P1 | May eventually move to marketing site. |
| `/for-parents` | ForParentsPage | public | Marketing | Parent acquisition page. | Demo flow, landing links | Pricing, register | demo | P2 | Marketing-site candidate. |
| `/how-it-works` | HowItWorksPage | public | Marketing | Product explanation. | Landing links | Pricing/register | demo | P2 | Marketing-site candidate. |
| `/ai-homework-help` | HowItWorksPage | public | Marketing | Alias to how-it-works. | Direct campaign URL | Pricing/register | duplicate | P3 | Keep hidden; consider redirect later. |
| `/teacher-support` | TeacherSupportPage | public | Marketing | Teacher-support explanation. | Public/demo links | Pricing/register | demo | P2 | Marketing-site candidate. |
| `/for-schools` | ForSchoolsPage | public | Partnership | School partnership landing. | Demo flow | Partnership onboarding | demo | P2 | Public demo route. |
| `/for-tutoring-centers` | ForTutoringCentersPage | public | Partnership | Tutoring center landing. | Demo flow | Partnership onboarding | demo | P2 | Public demo route. |
| `/partnership/onboarding` | PartnershipOnboardingPage | public | Partnership | Mock partnership interest form. | School/tutoring pages | Confirmation, support | demo | P2 | Not core app nav. |
| `/privacy` | PrivacyPage | public | Legal | Privacy placeholder. | Footer/sidebar | Back/home | core | P1 | Required legal route. |
| `/terms` | TermsPage | public | Legal | Terms placeholder. | Footer/sidebar | Back/home | core | P1 | Required legal route. |
| `/onboarding` | OnboardingPage | shared | Onboarding | Role guide/demo shortcuts. | Demo-only links | Role home | demo | P2 | Hide from main role nav. |
| `/support` | SupportPage | shared | Support | Support request entry. | Role nav, reports, billing | Tickets, submit | core | P1 | Shared support surface. |
| `/support/tickets` | SupportTicketsPage | shared | Support | User ticket list. | Support page | Ticket detail, support | core | P1 | Secondary support route. |
| `/support/tickets/:ticketId` | SupportTicketDetailPage | shared | Support | User ticket detail. | Ticket list | All tickets, support | core | P1 | Needs breadcrumb/back. |
| `/billing` | BillingPage | shared | Billing | Subscription state and plan prompts. | Parent nav, pricing/report CTAs | Pricing, checkout, support | core | P1 | Parent primary, shared route. |
| `/billing/checkout/demo` | VirtualCheckoutPage | shared | Billing | Virtual checkout demo. | Billing/pricing CTA | Success/cancel | demo | P2 | Explicitly mock. |
| `/billing/checkout/success` | CheckoutResultPage | shared | Billing | Checkout success result. | Virtual checkout | Billing/dashboard | demo | P2 | Alias also exists at `/billing/success`. |
| `/billing/checkout/cancel` | CheckoutResultPage | shared | Billing | Checkout cancel result. | Virtual checkout | Billing/pricing | demo | P2 | Alias also exists at `/billing/cancelled`. |
| `/referrals` | ReferralsPage | shared | Growth | Referral invite flow. | Parent nav, billing/growth CTAs | Register/share | core | P1 | Parent secondary. |
| `/dashboard` | StudentDashboardPage | student | Learning | Student overview and next action. | Login redirect, student nav | Chat, history, profile | core | P0 | Primary student home. |
| `/chat` | ChatPage | student | Learning | Ask AI questions and request teacher help. | Dashboard, student nav | Dashboard, history | core | P0 | Most important student action. |
| `/learning-history` | StudentLearningHistoryPage | student | Learning | Student history. | Student nav, chat/dashboard | Chat, dashboard | core | P1 | Student primary nav. |
| `/profile` | StudentProfilePage | student | Account | Student profile. | Student nav | Dashboard | core | P1 | Student primary nav. |
| `/parent` | ParentDashboardPage | parent | Parent | Parent overview and child list. | Login redirect, parent nav | Child detail, reports, billing | core | P0 | Parent home. |
| `/parent/children/:childId` | ChildSummaryPage | parent | Parent | Child learning summary. | Parent overview child cards | Report, history, parent overview | core | P0 | Needs breadcrumb/back. |
| `/parent/children/:childId/report` | ChildReportPage | parent | Parent | Weekly report. | Child summary, parent overview | Monthly report, billing, support | core | P0 | Candidate tab in unified report page. |
| `/parent/children/:childId/monthly-report` | ParentMonthlyReportPage | parent | Parent | Monthly report demo. | Weekly report, learning profile | Weekly report, billing, support | demo | P1 | Should merge into Reports later. |
| `/parent/children/:childId/history` | ChildLearningHistoryPage | parent | Parent | Child history. | Child summary/report | Child summary/report | core | P1 | Candidate tab under report/detail. |
| `/tutor` | TutorDashboardPage | tutor | Tutor | Tutor request queue. | Login redirect, tutor nav | Request detail, availability | core | P0 | Tutor home. |
| `/tutor/requests/:requestId` | TutorHelpRequestDetailPage | tutor | Tutor | Request review and status update. | Tutor request list | Tutor list | core | P0 | Needs back button. |
| `/tutor/availability` | TutorAvailabilityPage | tutor | Tutor | Availability and subjects. | Tutor nav | Tutor requests | core | P1 | Could become tutor settings later. |
| `/admin` | AdminDashboardPage | admin | Admin | Admin operations overview. | Admin login/nav | Usage, help requests, support | core | P0 | Keep focused. |
| `/admin/usage` | AdminUsagePage | admin | Admin | Usage summary. | Admin overview/nav | Admin overview | core | P1 | Overlaps analytics. |
| `/admin/analytics` | AdminAnalyticsPage | admin | Admin | Operational analytics. | Admin nav | Admin overview | core | P1 | Keep as normal analytics. |
| `/admin/advanced-analytics` | AdvancedAnalyticsPage | admin | Analytics | Platform analytics demo. | Demo flow/direct | Admin analytics | demo | P2 | Hide from primary admin nav. |
| `/admin/retention` | RetentionPage | admin | Analytics | Retention demo. | Demo/direct | Admin analytics | demo | P2 | Hide from primary admin nav. |
| `/admin/feedback` | AdminFeedbackPage | admin | Admin | Feedback list. | Admin overview | Support inbox | duplicate | P2 | Merge conceptually with support inbox. |
| `/admin/help-requests` | AdminHelpRequestsPage | admin | Admin | Help request monitoring. | Admin overview/nav | Admin overview | core | P1 | Primary admin task. |
| `/admin/support` | AdminSupportTicketsPage | admin | Support | Admin support inbox. | Admin nav | Ticket detail | core | P1 | Primary support triage. |
| `/admin/support/:ticketId` | AdminSupportTicketDetailPage | admin | Support | Admin ticket detail. | Support inbox | Support inbox, help requests | core | P1 | Needs breadcrumb/back. |
| `/admin/users` | AdminOperationsPlaceholderPage | admin | Admin | Future user management. | Admin nav secondary | Admin overview | placeholder | P3 | Keep low priority. |
| `/admin/billing-interest` | AdminOperationsPlaceholderPage | admin | Admin | Billing-interest placeholder. | Admin overview | Admin overview | placeholder | P3 | Hidden from primary nav. |
| `/admin/system` | AdminOperationsPlaceholderPage | admin | Admin | System-status placeholder. | Direct/admin future | Admin overview | placeholder | P3 | Hidden from primary nav. |
| `/organization` | OrganizationDashboardPage | organization | Organization | Organization demo overview. | Organization login/demo | Students, tutors, reports | demo | P1 | Organization-mode only. |
| `/organization/students` | OrganizationStudentsPage | organization | Organization | Student list. | Organization nav | Learning profile | demo | P1 | Entry to advanced learning profile. |
| `/organization/tutors` | OrganizationTutorsPage | organization | Organization | Tutor coverage. | Organization nav | Assignment board contextual | demo | P1 | Assignment should not be primary nav. |
| `/organization/reports` | OrganizationReportsPage | organization | Organization | Reports overview. | Organization nav | Parent reports/profile | demo | P1 | Demo surface. |
| `/organization/analytics` | OrganizationAnalyticsPage | organization | Organization | Organization analytics. | Organization nav | Organization overview | demo | P2 | Secondary nav. |
| `/organization/tutor-assignment` | TutorAssignmentBoardPage | organization | Organization | Tutor assignment board. | Tutors page/demo | Tutors/organization | demo | P2 | Hidden advanced route. |
| `/organization/students/:studentId/learning-profile` | StudentLearningProfilePage | organization | Learning Intelligence | Org-scoped learning profile. | Organization students | Diagnosis, graph, reports | demo | P2 | Preferred advanced route from org. |
| `/students/:studentId/learning-profile` | StudentLearningProfilePage | organization | Learning Intelligence | Direct learning profile. | Dashboard/report/demo | Diagnosis, graph, reports | demo | P2 | Hidden advanced route. |
| `/students/:studentId/diagnosis` | WeakPointDiagnosisPage | organization | Learning Intelligence | Diagnosis demo. | Learning profile | Graph, profile | demo | P2 | Hidden advanced route. |
| `/students/:studentId/curriculum-graph` | CurriculumGraphPage | organization | Learning Intelligence | Curriculum graph demo. | Learning profile/diagnosis | Diagnosis, profile | demo | P2 | Hidden advanced route. |
| `/curriculum-graph` | CurriculumGraphPage | organization | Learning Intelligence | Generic graph demo alias. | Direct only | Profile/diagnosis | duplicate | P3 | Consider redirect/deprecate. |

## Unrouted Legacy Page Components

The following page files exist but are not mounted in `AppRouter.tsx`: `src/pages/student/Ask.tsx`, `src/pages/student/Answer.tsx`, `src/pages/student/History.tsx`, `src/pages/student/Home.tsx`, `src/pages/teacher/Queue.tsx`, `src/pages/teacher/Session.tsx`, `src/pages/parent/Dashboard.tsx`, and `src/pages/parent/Report.tsx`. Treat these as deprecated legacy placeholders unless a future phase remounts or deletes them.
