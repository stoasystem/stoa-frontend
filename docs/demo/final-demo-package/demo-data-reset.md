# Demo Data Reset

## Reset Command

```bash
npm run demo:reset
```

The command runs the local backend reset script and restores seed data in the local SQLite-backed demo environment.

## Expected Reset Result

After reset, the demo should contain:

- Fixed student, parent, tutor, and admin accounts.
- Parent linked to student.
- Three student conversations:
  - Quadratic equations.
  - Forces and motion.
  - Essay thesis practice.
- Student/assistant messages in each conversation.
- One homework upload metadata example.
- Learning history items.
- Pending, assigned/in-progress, and resolved teacher-help requests.
- Weekly parent report with stats, weak topics, and recommendations.
- Support ticket seed data.
- Feedback seed data.
- Billing interest seed data.
- Admin analytics data derived from seeded records.

## Repeatability Rule

Run reset before every formal demo. Avoid relying on state created in a previous demo session.

## Validation Steps

1. Run `npm run demo:reset`.
2. Start `npm run demo:backend`.
3. Check `http://127.0.0.1:8000/health`.
4. Sign in as each fixed account.
5. Verify role landing and required data.

## Failure Handling

If reset fails:

- Capture the terminal error.
- Do not proceed with launch-candidate approval.
- Record the issue as P0 if it blocks repeatable demo flow.

If reset passes but data is incomplete:

- Record the missing data category in `docs/release/final-bug-triage.md`.
- Treat missing student/parent/tutor/admin core data as P0 or P1 depending on whether the demo can continue with a workaround.

