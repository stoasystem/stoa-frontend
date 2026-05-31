# Phase 175 Verification

Commands:

```bash
node -e '...locale key parity script...'
node -e '...French apostrophe scan...'
```

Browser smoke:

- Passed 184 route/locale/viewport checks.
- Routes included `/`, `/register`, `/pricing`, `/contact`, `/qa`, `/teacher-support`, `/dashboard`, `/practice`, `/chat`, `/billing`, `/parent`, `/parent/children/user-student/report`, `/tutor`, and `/tutor/requests/help-1`.
- Locales: English, German, French, Italian.
- Checked for raw key leakage, `undefined`, `[object Object]`, known forbidden phrases, and horizontal overflow.

Status: passed.
