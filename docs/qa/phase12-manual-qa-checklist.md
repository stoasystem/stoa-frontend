# Phase 12 Manual QA Checklist

## Organization

- [ ] `/organization` shows workspace selector and metrics.
- [ ] `/organization/students` shows student list and learning profile links.
- [ ] `/organization/tutors` shows tutor load and availability.
- [ ] `/organization/reports` shows weekly/monthly report overview.

## Learning Intelligence

- [ ] `/students/student-anna/learning-profile` shows student profile data.
- [ ] `/students/student-anna/diagnosis` shows diagnosis summary and evidence.
- [ ] `/students/student-anna/curriculum-graph` shows graph nodes and topic details.

## Tutor Operations

- [ ] `/organization/tutor-assignment` shows requests, tutors, suggestions, and schedule.
- [ ] Manual assign button shows placeholder behavior.

## Parent Monthly Report

- [ ] `/parent/children/student-anna/monthly-report` shows monthly summary and trends.
- [ ] PDF button shows placeholder behavior.

## Analytics and Retention

- [ ] `/admin/advanced-analytics` shows metrics, subject bars, funnel, and cohorts.
- [ ] `/organization/analytics` shows organization analytics.
- [ ] `/admin/retention` shows inactive students and at-risk families.

## Partnership

- [ ] `/for-schools` links to onboarding.
- [ ] `/for-tutoring-centers` links to onboarding.
- [ ] `/partnership/onboarding` can submit mock interest.

## Build

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Route smoke or E2E checks pass where feasible.
