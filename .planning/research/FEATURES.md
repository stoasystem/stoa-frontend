# Project Research — Features For Phase 12

**Updated:** 2026-05-25
**Mode:** Research-first update after Phase 12 milestone approval

## Table Stakes

- Organization selector and workspace concept.
- Organization dashboard with student/tutor/report/analytics navigation.
- Organization students/tutors lists with links to deeper profiles.
- Advanced learning profile with weak/strong topics, history, and recommended actions.
- Curriculum graph/topic graph with topic status and detail panel. The first version should be readable and deterministic, not algorithmic.
- Weak-point diagnosis with evidence and recommendations.
- Tutor assignment board with pending requests, available tutors, and suggested assignment placeholder.
- Parent monthly report with monthly summary, subject breakdown, trends, recommendations, and PDF placeholder.
- Advanced analytics and retention UI.
- Partnership onboarding form and school/tutoring center landing entry.

## Differentiators

- Show platform story clearly: family product -> tutor operations -> organization management -> learning intelligence.
- Make all advanced intelligence visibly demo/mock so trust is preserved.
- Keep school/tutoring pages focused on partner evaluation, not a full sales/CRM system.
- Use organization pages to prove the information architecture before any production tenant backend exists.
- Use learning profile/diagnosis/graph pages to show what data the future backend must eventually supply.

## Anti-Features

- Production multi-tenant permission model.
- Real curriculum graph engine.
- Real AI diagnosis engine.
- Tutor matching algorithm.
- Automated retention emails/tasks.
- Enterprise invoicing or contract management.

## Feature Priorities

1. Build organization/workspace foundation first because it anchors school and tutoring center demos.
2. Add learning profile and diagnosis before graph UI because graph detail should link back to student learning evidence.
3. Add tutor assignment and monthly report after profile data exists so those pages can share mock student/topic signals.
4. Add advanced analytics and partnership onboarding after the platform surface is coherent.
