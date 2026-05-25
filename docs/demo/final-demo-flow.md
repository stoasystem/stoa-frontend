# Final Demo Flow

Phase 13 demo flow avoids manual URL entry after the first page. Demo data and auth shortcuts must remain stable for a reliable walkthrough.

## Recommended Flow

1. Open `/for-parents`.
2. Open pricing from the parent landing page.
3. Log in as a student demo account.
4. Land on `/dashboard`.
5. Open Chat from the student nav or dashboard CTA.
6. Upload homework or ask a mock homework question.
7. Show AI response and teacher-help request status.
8. Log in as a tutor demo account.
9. Open Requests and resolve or update a request.
10. Log in as a parent demo account.
11. Open Parent Overview.
12. Select a child and open Weekly Report.
13. Open Monthly Report, then Billing or Support.
14. Log in as an admin demo account.
15. Open Admin Overview, Help Requests, Support Inbox, and Analytics.
16. Optional platform demo: log in as organization role, open Organization Overview, Students, and Learning Profile.

## Rules

- Do not enter complex placeholder pages during the core demo.
- Do not present virtual checkout as real payment.
- Do not present diagnosis or curriculum graph as real AI/graph computation.
- Use visible navigation or page CTAs for every step.
- If a step requires a direct URL, the previous page needs a link before the demo is considered ready.

## Demo Accounts

Use the current seed/demo accounts documented in README and local backend docs. Phase 13 does not create new accounts.

## Route Coverage

Core demo routes:

- `/for-parents`
- `/pricing`
- `/dashboard`
- `/chat`
- `/tutor`
- `/parent`
- `/parent/children/:childId/report`
- `/parent/children/:childId/monthly-report`
- `/billing`
- `/admin`
- `/admin/help-requests`
- `/admin/support`
- `/admin/analytics`
- `/organization`
- `/organization/students`
- `/students/:studentId/learning-profile`
