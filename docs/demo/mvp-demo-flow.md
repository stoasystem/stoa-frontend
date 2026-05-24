# MVP Demo Flow

## Goal

Show the STOA loop: student learns with AI, tutor handles help, parent sees progress.

## Demo Accounts

- Student: `student@test.com / password123`
- Parent: `parent@test.com / password123`
- Tutor: `tutor@test.com / password123`
- Admin: `admin@test.com / password123`

## Student

1. Login as student.
2. Open dashboard.
3. Open chat.
4. Send a math or physics question.
5. Upload a homework file if available.
6. Watch the assistant response.
7. Request teacher help.

## Tutor

1. Login as tutor.
2. Open tutor dashboard.
3. Filter pending requests.
4. Open request detail.
5. Mark request in progress.
6. Add a teacher note.
7. Mark request resolved.

## Parent

1. Login as parent.
2. Open parent dashboard.
3. Open Anna Keller's summary.
4. Review stats, weak topics, and recent questions.
5. Open weekly report.
6. Submit feedback.

## Demo Reset

Local reset:

```bash
cd backend
.venv/bin/python -m app.reset_demo_data
```

Future staging reset should be admin-gated and disabled in production.

## Pre-Demo Check

- [ ] Frontend staging URL loads.
- [ ] Backend health check passes.
- [ ] Demo accounts login.
- [ ] `/chat`, `/parent`, and `/tutor` route refreshes work.
- [ ] Feedback button is available.
