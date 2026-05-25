# Support Workflow

## Purpose

The pilot support workflow gives students, parents, and tutors a lightweight path for reporting product issues, access problems, parent report questions, and pilot feedback without building a full helpdesk.

## Entry Points

- `/support` explains FAQ, bug feedback, teacher-help distinction, contact path, and pilot-stage expectations.
- `/support` submits typed requests through `POST /support/requests`.
- If a backend environment has not implemented `/support/requests` yet, it may route the same payload into the existing feedback-compatible storage used by `POST /feedback`.

## Request Payload

Support requests should include:

- `category`: account access, bug, teacher-help question, parent report, pilot feedback, or other.
- `severity`: low, normal, high, or urgent.
- `subject` and `message`.
- Optional `contactEmail`, `page`, `userRole`, and `createdAt`.

Do not include passwords, access tokens, full private chat transcripts, file contents, or sensitive child data that is not needed to triage the issue.

## Triage

Support triage runs from highest user impact to lowest:

- **Urgent**: live pilot session blocked, account access broken for an active user, or widespread outage. Target first response: same pilot day.
- **High**: student, parent, or tutor cannot complete a core pilot task, but a workaround exists. Target first response: next pilot day.
- **Normal**: confusing UI, stale data, report concern, or non-blocking workflow issue. Target first response: within two pilot days.
- **Low**: suggestion, copy issue, or minor polish. Target first response: weekly review.

## Ownership

- Product/support owner reviews new support requests, assigns severity, and confirms the category.
- Engineering owns confirmed product defects, endpoint failures, and broken frontend flows.
- Tutor operations owns teacher-help workflow confusion and tutor status handling questions.
- Pilot coordinator owns participant communication and expectation setting.

## Teacher Help Distinction

Teacher help is for a student learning question that needs human tutor review from Chat. Support is for the product or pilot workflow itself: login, missing child data, broken pages, confusing reports, or operational questions.

If a support request is really a learning question, redirect the user to Chat teacher help. If a teacher-help request is really a product issue, create or link a support request.

## Response Expectations

Every response should acknowledge the issue, state the next step, and avoid promising a feature delivery date unless it has already been committed. For bugs, include whether the team needs more reproduction details. For parent report questions, explain what data is visible during the pilot and what is intentionally withheld.
