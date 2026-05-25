# Orphan Page Audit

Orphan pages are routes or page components that can only be reached by manually typing a URL, or components that exist but are not mounted.

## Core Orphans

| Page | Status | Treatment |
|------|--------|-----------|
| None known after Phase 13 navigation pass | — | Core routes either appear in role navigation or have contextual entry/exit documented in `page-entry-exit-audit.md`. |

## Demo / Advanced Orphans

| Route | Status | Treatment |
|-------|--------|-----------|
| `/admin/advanced-analytics` | demo | Hidden from admin primary nav; keep in final demo flow or contextual analytics links. |
| `/admin/retention` | demo | Hidden from admin primary nav; keep as advanced analytics/retention demo. |
| `/organization/tutor-assignment` | demo | Hidden from primary organization nav; enter from Tutors context or demo docs. |
| `/students/:studentId/learning-profile` | demo | Hidden from primary nav; enter from organization students, reports, or demo flow. |
| `/students/:studentId/diagnosis` | demo | Enter from learning profile. |
| `/students/:studentId/curriculum-graph` | demo | Enter from learning profile or diagnosis. |
| `/curriculum-graph` | duplicate | Keep hidden; prefer student-scoped graph route. |
| `/partnership/onboarding` | demo | Enter from school/tutoring public pages. |

## Unmounted Page Components

| Component | Treatment |
|-----------|-----------|
| `src/pages/student/Ask.tsx` | Deprecated legacy placeholder; do not expose in nav. |
| `src/pages/student/Answer.tsx` | Deprecated legacy placeholder; do not expose in nav. |
| `src/pages/student/History.tsx` | Deprecated legacy placeholder; replaced by `/learning-history`. |
| `src/pages/student/Home.tsx` | Deprecated legacy placeholder; replaced by `/dashboard`. |
| `src/pages/teacher/Queue.tsx` | Deprecated legacy placeholder; tutor routes replaced teacher role routes. |
| `src/pages/teacher/Session.tsx` | Deprecated legacy placeholder. |
| `src/pages/parent/Dashboard.tsx` | Deprecated legacy placeholder; replaced by `ParentDashboardPage`. |
| `src/pages/parent/Report.tsx` | Deprecated legacy placeholder; replaced by `ChildReportPage`. |

## Policy

- Core orphan pages must receive a nav item or contextual card/CTA.
- Demo orphan pages must be documented and reachable from demo flow or advanced/contextual entry.
- Placeholder and duplicate pages stay hidden unless a future milestone promotes or removes them.
