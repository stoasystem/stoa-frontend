# Manual QA Checklist

Run this checklist before inviting early users onto staging.

## Auth

- [ ] Student can login.
- [ ] Parent can login.
- [ ] Tutor can login.
- [ ] Admin can login.
- [ ] Wrong password shows a readable error.
- [ ] Logout clears auth and returns to login.
- [ ] Unauthenticated `/chat` redirects to `/login`.
- [ ] Role mismatch redirects to `/forbidden`.

## Student Flow

- [ ] Student lands on `/dashboard`.
- [ ] Student can open `/chat`.
- [ ] Student can create or select a conversation.
- [ ] Student can send a text question.
- [ ] Streaming assistant response appears.
- [ ] PNG, JPEG, and PDF upload validation works.
- [ ] Student can request teacher help.
- [ ] Student can open learning history.
- [ ] Student can edit profile.

## Parent Flow

- [ ] Parent lands on `/parent`.
- [ ] Parent sees children list.
- [ ] Parent can open child summary.
- [ ] Child summary shows stats, weak topics, and recent questions.
- [ ] Parent can open weekly report.
- [ ] Parent cannot open `/chat`.

## Tutor Flow

- [ ] Tutor lands on `/tutor`.
- [ ] Tutor sees help requests.
- [ ] Tutor can filter by status.
- [ ] Tutor can open request detail.
- [ ] Tutor can update status.
- [ ] Tutor can add teacher note.

## Responsive

- [ ] `/login` works at 375px.
- [ ] `/chat` works at 375px.
- [ ] `/parent` works at 375px.
- [ ] `/tutor` works at 375px.
- [ ] 768px tablet layout is usable.
- [ ] 1024px laptop layout is usable.

## Feedback

- [ ] Feedback button appears when enabled.
- [ ] Feedback can be submitted.
- [ ] Success toast appears.
- [ ] Submitted feedback is persisted by backend.
