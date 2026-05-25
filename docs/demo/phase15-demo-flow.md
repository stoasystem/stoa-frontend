# Phase 15 Demo Flow

**Last updated:** 2026-05-25

Phase 15 reshapes the demo around a student-first learning path. The homepage no longer treats AI support, teacher help, and parent visibility as equal entry cards. It presents STOA as one learning platform:

```text
Student asks a homework question
  -> STOA AI explains first
  -> student asks a human tutor if needed
  -> parent can follow learning progress
```

## Run The Demo

Start the demo backend:

```bash
npm run demo:backend
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## Homepage Demo

1. Open `/`.
2. Confirm the first viewport shows the STOA brand, magazine-style hero image, and `Start Learning`.
3. Confirm the old `AI Support`, `Teacher Backup`, and `Parent Visibility` card trio is gone.
4. Scroll to `How STOA helps students`.
5. Confirm the flow is shown in order: ask, AI explanation, teacher if needed, parent progress.

## Student Demo

Use either:

- fixed account: `student@test.com / password123`
- register a new student from `/register`

Student registration collects:

- age
- school
- grade
- optional school system
- subjects needing help
- parent name
- parent email

After registration, continue to `/chat` and ask a homework question. The AI returns a deterministic demo response. Below the AI response, use `Ask a human tutor` to create a teacher-help request.

## Parent Demo

Use either:

- fixed account: `parent@test.com / password123`
- register a new parent from `/register`

Parent registration collects child profile data. The demo backend prepares a linked child record for the current demo session.

Open `/parent` to inspect child summary, history, and reports.

## Tutor Demo

Use either:

- fixed account: `tutor@test.com / password123`
- register a new tutor from `/register`

Tutor registration collects:

- teaching subjects
- education background
- years of experience
- short introduction
- diploma, teaching certificate, or qualification document

Supported credential upload formats:

- PDF
- PNG
- JPEG

Maximum file size: 10 MB.

The demo backend returns `verificationStatus: pending_review`. This is not real verification.

## Demo Boundary

Phase 15 does not implement:

- production authentication
- real parent identity verification
- real tutor credential review
- certificate OCR
- real email invitations
- production file storage
- production backend architecture

All new backend behavior is demo-only and replaceable.
