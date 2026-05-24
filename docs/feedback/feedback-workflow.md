# Feedback Workflow

## Collection

When `VITE_ENABLE_FEEDBACK=true`, authenticated users can submit feedback from the app layout.

Feedback payload:

- `type`: `bug`, `confusion`, `suggestion`, or `praise`
- `page`: current route
- `message`: user text
- `userRole`: current role when available
- `createdAt`: client timestamp

The local backend stores feedback in the `feedback` SQLite table.

## Review

During early testing, review feedback after each test session:

1. Export or inspect feedback rows.
2. Group by type and route.
3. Convert actionable bugs into GitHub Issues.
4. Link screenshots or recordings when available.
5. Mark non-actionable feedback as notes for product review.

## Severity

- Critical: login, chat send, or core role flow is blocked.
- High: important feature fails, such as upload or teacher help.
- Medium: confusing or degraded experience with a workaround.
- Low: copy, spacing, or minor visual issue.

## Triage Rules

- Create an issue for every Critical or High feedback item.
- Batch similar Medium/Low items by page.
- Keep praise/suggestions in product notes unless they imply a bug.
- Include role, route, browser/device, and reproduction steps when possible.
