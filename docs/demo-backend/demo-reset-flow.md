# Demo Reset Flow

The demo reset command restores the local backend to a known state.

```bash
npm run demo:reset
```

If using the Python backend directly:

```bash
cd backend
PYTHONPATH=. python3 -m app.reset_demo_data
```

## Reset Restores

- Fixed student, parent, tutor, and admin users.
- Parent-child linkage.
- Student profile.
- Conversations and messages.
- Uploaded file metadata.
- Learning history.
- Teacher help requests.
- Parent reports.
- Tutor notes.
- Analytics demo event.
- Feedback and support demo data.
- Billing, referral, and admin demo data where persisted.

## Reset Clears

- Temporary registered users.
- Temporary conversations and messages.
- Temporary support tickets.
- Temporary feedback.
- Mutated help-request status changes.
- Any local session changes created after the seed data was loaded.

## QA Expectations

After reset:

1. `/health` returns demo backend status.
2. All four demo accounts can log in with `password123`.
3. Student can list the three seed conversations.
4. Parent can see Anna Keller as a child.
5. Tutor can see pending and active teacher-help requests.
6. Billing, referral, support, and admin demo endpoints return stable data.

