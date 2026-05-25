---
phase: 45
title: Basic Admin Operations UI Spec
status: complete
---

# UI Spec

## `/admin`

- Shows "Pilot operations" as the page title.
- Shows a "Basic operations" status badge.
- Shows environment basics: environment, app version, and API base URL.
- Shows two operation cards linking to usage summary and feedback triage.
- States that full user management and broader admin controls remain deferred.

## `/admin/usage`

- Shows a usage summary page title and scope description.
- Uses usage cards for active users, messages, help requests, uploads, and feedback when backend data exists.
- Shows role counts for student, parent, tutor, and admin.
- Shows a backend-pending placeholder when `GET /admin/usage-summary` is unavailable.

## `/admin/feedback`

- Shows a feedback page title and scope description.
- Lists returned feedback items with type, optional status, optional role, message, page, optional user email, and created time.
- Shows a backend-pending placeholder when `GET /admin/feedback` is unavailable.

## Deferral

No UI controls are provided for full user management, role changes, account suspension, support case handling, or platform content administration.
