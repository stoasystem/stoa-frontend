# Duplicate / Overlap Audit

## Parent Reporting

| Routes | Overlap | Decision |
|--------|---------|----------|
| `/parent/children/:childId/report` and `/parent/children/:childId/monthly-report` | Weekly and monthly report tell related parent progress stories. | Keep both for Phase 13, link them clearly, and treat future Reports as a tabbed/detail area. |
| `/parent/children/:childId/history` and report pages | History supports report evidence. | Keep contextual, not primary nav. Future: move into child detail/report tabs. |

## Learning Intelligence

| Routes | Overlap | Decision |
|--------|---------|----------|
| `/students/:studentId/learning-profile`, `/students/:studentId/diagnosis`, `/students/:studentId/curriculum-graph` | All are advanced analysis surfaces. | Keep profile as the hub; diagnosis and graph are detail/adjacent views. |
| `/organization/students/:studentId/learning-profile` and `/students/:studentId/learning-profile` | Two paths render the same profile. | Prefer organization-scoped path from organization students; keep direct route for demo compatibility. |
| `/curriculum-graph` and `/students/:studentId/curriculum-graph` | Generic alias lacks context. | Mark generic alias duplicate/hidden; prefer student-scoped route. |

## Admin Operations

| Routes | Overlap | Decision |
|--------|---------|----------|
| `/admin/usage` and `/admin/analytics` | Both describe activity metrics. | Keep usage as operational activity, analytics as reporting. Do not expose advanced analytics as primary. |
| `/admin/analytics` and `/admin/advanced-analytics` | Basic vs platform demo analytics. | Keep advanced analytics hidden/demo. |
| `/admin/feedback` and `/admin/support` | Feedback and support triage overlap. | Keep support inbox primary; hide feedback as duplicate/secondary historical surface. |
| `/admin/help-requests` and `/tutor` | Both touch teacher help. | Admin monitors volume; tutor resolves individual requests. Keep separate by role. |

## Organization vs Admin

| Routes | Overlap | Decision |
|--------|---------|----------|
| `/organization/analytics` and `/admin/analytics` | Reporting at different scopes. | Organization analytics is organization-mode demo; admin analytics is platform operations. |
| `/organization/tutor-assignment` and admin tutor assignment concept | Both could be operational. | Keep assignment under organization Tutors context, not admin primary nav. |

## Public Marketing

| Routes | Overlap | Decision |
|--------|---------|----------|
| `/how-it-works` and `/ai-homework-help` | Same page component. | Prefer `/how-it-works`; keep `/ai-homework-help` hidden as campaign alias. |
| `/for-schools`, `/for-tutoring-centers`, `/partnership/onboarding` | Partnership funnel. | Keep landing pages separate; onboarding is the shared conversion destination. |
