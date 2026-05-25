---
phase: 44
title: Pilot Onboarding and Support Workflow UI Spec
status: in-progress
---

# UI Spec

## Routes

- `/onboarding`: role-specific pilot onboarding for students, parents, and tutors.
- `/support`: pilot support guidance and support request contact form.

## Layout

- Use existing `DashboardLayout`, `PageContainer`, and `PageHeader`.
- Keep pages dense and operational, matching the current dashboard and tutor surfaces.
- Use existing `Card`, `Badge`, `Button`, `Input`, `Textarea`, and `Label` primitives.

## Onboarding Content

- Student card explains profile grade/subject setup, Chat entry, and teacher-help escalation.
- Parent card explains child dashboard, report visibility, and support for access/report issues.
- Tutor card explains help request list, detail review, notes, and status progression.

## Support Content

- FAQ section answers where students, parents, and tutors should start.
- Bug feedback section asks for expected result, actual result, page, role, and severity.
- Teacher-help distinction states that learning questions go through Chat teacher help and product issues go through support.
- Contact path section explains the request form and feedback-compatible fallback.
- Pilot expectations set controlled-launch response expectations without promising full helpdesk coverage.

## States

- Support form validates subject and message before submit.
- Pending submit disables the submit button and changes its label.
- Success and failure are surfaced through existing toast behavior.
