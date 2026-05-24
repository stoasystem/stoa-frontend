# Frontend Security Review

Phase 8 security review is a staging-readiness checklist. It does not replace backend authorization, backend validation, or formal legal/compliance review.

## Checklist

- [ ] No API secrets are stored in frontend source.
- [ ] No model provider API keys are stored in frontend source or `VITE_*` variables.
- [ ] Frontend does not connect directly to SQLite or any database.
- [ ] Only the access token is stored in `localStorage`; passwords are never stored.
- [ ] `localStorage` token risk is documented as an MVP tradeoff.
- [ ] Demo shortcuts are disabled when `VITE_APP_ENV=production`.
- [ ] Protected routes and role routes exist.
- [ ] 401 clears auth and redirects to login.
- [ ] 403 redirects to forbidden without clearing auth.
- [ ] File upload UI limits type, size, and count.
- [ ] Backend upload validation remains required.
- [ ] Chat and feedback content render as text, not dangerous HTML.
- [ ] Privacy and terms placeholders are public.

## XSS Notes

React escapes text by default. Do not introduce `dangerouslySetInnerHTML` for chat, feedback, reports, or tutor notes. If Markdown rendering is added later, use a safe renderer and sanitize or disallow raw HTML.

## Upload Notes

Frontend upload restrictions improve UX only. Backend must validate file type, size, filename, storage path, and parser behavior.

## Production Follow-Up

- Review auth token storage and consider httpOnly cookies or short-lived access plus refresh flow.
- Add Content Security Policy after deployment platform is selected.
- Add formal privacy/legal review before pilot launch.
