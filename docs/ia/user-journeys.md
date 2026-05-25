# User Journeys

## Student Primary Journey

```text
Login
  -> Dashboard
  -> Start or continue chat
  -> Chat
  -> AI answer / upload file / request teacher
  -> Dashboard or Learning History
```

Optimization checks:

- Dashboard must keep Chat obvious.
- Chat must not trap the student after an answer.
- Teacher-help status should be visible from dashboard or chat context.

## Parent Primary Journey

```text
Login
  -> Parent Overview
  -> Select child
  -> Child Summary
  -> Weekly or Monthly Report
  -> Billing / Support / Recommendations
```

Optimization checks:

- Parent routes should not push users into student chat.
- Reports should explain child progress and the next parent action.
- Billing and support should be accessible from report surfaces.

## Tutor Primary Journey

```text
Login
  -> Requests
  -> Request detail
  -> Review context
  -> Add note or update status
  -> Requests
```

Optimization checks:

- Request detail needs a clear return to `/tutor`.
- Mark resolved should remain a primary action after the note requirement is met.
- Tutor analytics and advanced student intelligence should not distract from request resolution.

## Admin Primary Journey

```text
Login
  -> Admin Overview
  -> Learning Activity / Help Requests / Support Inbox
  -> Detail
  -> Take action or record issue
  -> Admin Overview or list
```

Optimization checks:

- Admin overview should not become a dense directory of every future route.
- Support and help requests need short paths.
- Advanced analytics and retention remain demo/hidden.

## Organization Demo Journey

```text
Login as organization role
  -> Organization Overview
  -> Students / Tutors / Reports / Analytics
  -> Student Learning Profile
  -> Diagnosis or Curriculum Graph
  -> Organization Students or Overview
```

Optimization checks:

- Organization mode is separate from admin mode.
- Tutor assignment is contextual from Tutors, not a default top-level item.
- Learning profile, diagnosis, and graph must say they are demo surfaces.
