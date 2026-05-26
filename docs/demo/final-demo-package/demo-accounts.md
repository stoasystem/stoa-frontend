# Demo Accounts

## Locked Accounts

| Role | Email | Password | Expected Name | Expected Landing |
|------|-------|----------|---------------|------------------|
| Student | `student@test.com` | `password123` | Anna Keller | Student dashboard or chat |
| Parent | `parent@test.com` | `password123` | Martin Keller | Parent dashboard |
| Tutor | `tutor@test.com` | `password123` | Dr. Lena Vogt | Tutor request workflow |
| Admin | `admin@test.com` | `password123` | STOA Admin | Admin overview |

## Rules

- These accounts are internal demo-operation accounts.
- Do not display these credentials in normal user-facing UI.
- Reset must preserve accounts, roles, passwords, and parent-child link.
- Public registration must not create admin accounts.

## Validation Checklist

- [ ] Student can sign in.
- [ ] Student reaches student dashboard or chat.
- [ ] Parent can sign in.
- [ ] Parent sees linked child.
- [ ] Tutor can sign in.
- [ ] Tutor sees request queue.
- [ ] Admin can sign in.
- [ ] Admin sees overview data.

## Expected Role Data

Student:

- At least three conversations.
- Homework upload metadata example.
- Teacher-help request.
- Learning history.
- Clear next action on dashboard.

Parent:

- One linked child: Anna Keller.
- Child summary.
- Weekly report.
- Recommendations.
- Billing/plan state.

Tutor:

- Pending request.
- Assigned or in-progress request.
- Resolved request.
- Tutor note/context.

Admin:

- Usage summary.
- Support tickets.
- Feedback item.
- Teacher-help requests.
- Contact requests once submitted during demo.

