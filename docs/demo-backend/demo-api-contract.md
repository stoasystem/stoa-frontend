# Demo API Contract

All demo backend errors should use:

```json
{
  "message": "Invalid demo credentials",
  "code": "DEMO_INVALID_CREDENTIALS"
}
```

Common demo error codes:

- `DEMO_INVALID_CREDENTIALS`
- `DEMO_UNAUTHORIZED`
- `DEMO_FORBIDDEN`
- `DEMO_NOT_FOUND`
- `DEMO_VALIDATION_ERROR`
- `DEMO_UNSUPPORTED_FLOW`

## Health

### `GET /health`

Response:

```json
{
  "ok": true,
  "service": "stoa-demo-backend",
  "mode": "demo"
}
```

## Auth

### `POST /auth/login`

Request:

```json
{
  "email": "student@test.com",
  "password": "password123"
}
```

Response:

```json
{
  "accessToken": "demo-token-student",
  "user": {
    "id": "user-student",
    "name": "Anna Keller",
    "email": "student@test.com",
    "role": "student"
  }
}
```

### `POST /auth/register`

Accepts `name`, `email`, `password`, `role`, and an optional role-specific `profile`. Public demo registration supports `student`, `parent`, and `tutor`; admin accounts remain fixed demo accounts.

Student request example:

```json
{
  "role": "student",
  "name": "Anna Keller",
  "email": "anna@example.com",
  "password": "password123",
  "profile": {
    "age": 14,
    "school": "Kantonsschule Zürich Nord",
    "grade": "Grade 8",
    "schoolSystem": "Swiss Gymnasium",
    "subjectsNeedingHelp": ["Mathematics", "Physics"],
    "parentName": "Michael Keller",
    "parentEmail": "michael@example.com"
  }
}
```

Student response can include:

```json
{
  "accessToken": "demo-token-student",
  "user": {
    "id": "user-student-new",
    "name": "Anna Keller",
    "email": "anna@example.com",
    "role": "student"
  },
  "onboardingStatus": "completed",
  "parentLinked": true
}
```

Tutor response can include:

```json
{
  "accessToken": "demo-token-tutor",
  "user": {
    "id": "user-tutor-new",
    "name": "Dr. Sample Tutor",
    "email": "tutor@example.com",
    "role": "tutor"
  },
  "onboardingStatus": "pending_review",
  "verificationStatus": "pending_review"
}
```

This is not production registration or real identity verification.

### `GET /auth/me`

Reads `Authorization: Bearer <accessToken>` and returns the current user.

## Conversations and Messages

### `GET /conversations`

Returns the current student's conversations:

```json
{
  "items": [
    {
      "id": "conv-1",
      "title": "Quadratic equations",
      "subject": "Mathematics",
      "grade": "Grade 8",
      "updatedAt": "2026-05-25T12:00:00Z",
      "lastMessagePreview": "Let's break it into steps."
    }
  ]
}
```

### `GET /conversations/:conversationId`

Returns conversation metadata plus ordered messages. Messages include `attachments`.

### `POST /conversations`

Creates a temporary conversation for the current demo session.

### `POST /conversations/:conversationId/messages`

Accepts `content` and optional `attachmentIds`, stores a student message, and returns a deterministic assistant demo response.

### `POST /conversations/:conversationId/messages/stream`

Returns SSE-style demo events compatible with the frontend streaming client. This is a mock stream, not real AI provider streaming.

## Files

### `POST /files`

Accepts demo homework uploads for logged-in students. Supported formats are PDF, PNG, and JPEG up to 10 MB. Returns uploaded file metadata.

### `POST /files/tutor-credentials`

Accepts mock tutor credential uploads for onboarding. Supported formats are PDF, PNG, and JPEG up to 10 MB.

Response:

```json
{
  "id": "credential-file-1",
  "filename": "diploma.pdf",
  "status": "uploaded"
}
```

The upload is demo-only and does not perform OCR, storage hardening, identity verification, or credential approval.

## Teacher Help and Tutor

### `POST /teacher-help/request`

Accepts `conversationId` and optional `message`. Returns `requestId`, `conversationId`, `status`, and timestamps.

### `GET /teacher-help/request/:requestId`

Returns the student-visible status of a help request.

### `GET /tutors/me/help-requests`

Returns pending, in-progress, and resolved tutor requests visible to the current tutor.

### `GET /tutors/me/help-requests/:requestId`

Returns request detail, student context, conversation messages, and tutor notes.

### `PATCH /tutors/me/help-requests/:requestId`

Accepts a status such as `pending`, `in_progress`, or `resolved` and updates the demo request.

## Parent

### `GET /parents/me/children`

Returns the parent-linked demo child.

### `GET /parents/me/children/:childId/summary`

Returns child stats, weak topics, recent questions, and teacher help records.

### `GET /parents/me/children/:childId/history`

Returns learning history items.

### `GET /parents/me/children/:childId/report`

Returns weekly parent report data.

### `GET /parents/me/children/:childId/monthly-report`

Returns a monthly report placeholder suitable for frontend demonstration.

## Billing

### `GET /billing/plans`

Returns available plan catalog.

### `GET /billing/subscription`

Returns current mock subscription.

### `GET /billing/usage`

Returns quota and usage counters.

### `GET /billing/feature-access`

Returns advisory feature access flags for UI display.

### `POST /billing/checkout-session`

Returns:

```json
{
  "checkoutUrl": "/billing/success?plan=family"
}
```

No card data or webhook is involved.

## Referrals

### `GET /referrals/me`

Returns stable referral code, invite URL, and successful invite count.

## Feedback and Support

### `POST /feedback`

Creates a feedback item.

### `POST /support/tickets`

Creates a support ticket.

### `GET /support/tickets`

Lists support tickets for the current demo session.

### `GET /support/tickets/:ticketId`

Returns ticket detail.

## Admin

### `GET /admin/analytics/overview`

Returns operational demo metrics.

### `GET /admin/support/tickets`

Returns support tickets for admin triage.

### `PATCH /admin/support/tickets/:ticketId`

Updates demo ticket status.

### `GET /admin/help-requests`

Returns teacher help requests across demo users.

### `GET /admin/feedback`

Returns feedback items.
