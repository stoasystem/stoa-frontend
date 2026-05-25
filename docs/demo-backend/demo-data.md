# Demo Data

## Fixed Accounts

| Role | Email | Password | Name | User ID |
|------|-------|----------|------|---------|
| Student | `student@test.com` | `password123` | Anna Keller | `user-student` |
| Parent | `parent@test.com` | `password123` | Martin Keller | `user-parent` |
| Tutor | `tutor@test.com` | `password123` | Dr. Lena Vogt | `user-tutor` |
| Admin | `admin@test.com` | `password123` | STOA Admin | `user-admin` |

The parent account is linked to the student account. Reset must preserve these accounts and relationships.

## Student Data

- Student profile for Anna Keller, Grade 8.
- Three conversations:
  - `conv-1`: Quadratic equations.
  - `conv-2`: Forces and motion.
  - `conv-3`: Essay thesis practice.
- Student and assistant messages for every conversation.
- Uploaded file metadata for a physics homework PDF.
- Learning history items derived from the conversations.
- Weak topics and recommended next actions for parent reports.

## Tutor Data

- At least two pending help requests.
- At least one in-progress or assigned request.
- At least one resolved request.
- Tutor note data for one request.
- Tutor availability and stats may be represented as fixed demo API responses.

## Parent Data

- One linked child: Anna Keller.
- Child summary with stats, recent questions, weak topics, and teacher help records.
- Weekly report with top subjects, weak topics, recommendations, and generated timestamp.
- Monthly report placeholder for demo continuity.

## Billing Data

- Plan catalog for free, student, family, and school/organization-style plans where supported by the UI.
- Current subscription.
- Usage quota.
- Feature access flags.
- Mock checkout result.

## Referral Data

- Stable code: `KELLER2026`.
- Invite URL based on `http://localhost:5173/register?ref=KELLER2026`.
- Successful invite count.

## Support and Admin Data

- Seed feedback item.
- Seed support ticket.
- Admin analytics overview.
- Admin support ticket list.
- Admin teacher help request list.
- Admin feedback list.

## Temporary Session Data

The demo backend may store temporary registered users, created conversations, messages, tickets, and status updates during a local session. Reset clears those temporary changes.

