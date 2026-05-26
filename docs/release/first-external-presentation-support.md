# First External Presentation Support

**Release:** STOA Learning Platform public demo release
**Date:** 2026-05-26

## Demo Preparation

- Use Chrome or a current Chromium-based browser.
- Use a laptop or desktop display when presenting to groups.
- Set browser zoom to 100%.
- Close unrelated tabs and notifications.
- Open the frontend URL before the call.
- Confirm the language matches the audience.
- Keep this document and the demo accounts available in a private presenter note.

## Recommended Accounts

| Role | Email | Password | Use |
|------|-------|----------|-----|
| Student | `student@test.com` | `password123` | Homepage -> login -> chat -> teacher support request. |
| Parent | `parent@test.com` | `password123` | Parent dashboard and child report. |
| Tutor | `tutor@test.com` | `password123` | Tutor request queue and request resolution. |
| Admin | `admin@test.com` | `password123` | Admin overview and operations visibility. |

Do not show the credential table on screen during external presentations.

## Recommended Demo Order

1. Homepage: explain the learning promise and teacher support boundary.
2. Student login: open dashboard or chat.
3. Chat: ask a short math question.
4. Teacher support: request professional support.
5. Tutor login: show request queue and request detail.
6. Parent login: show child report and parent-friendly explanation.
7. Pricing: show plan structure without implying live payment collection.
8. Contact: show how interested families can reach STOA.
9. Admin overview: show only if the audience needs operational context.

## Backup Flow

If a live flow fails, continue with the nearest stable page:

| Failure | Backup |
|---------|--------|
| Login fails | Return to homepage, pricing, and contact pages; explain role flows verbally. |
| Chat send fails | Show existing conversation history and move to parent report. |
| Teacher request fails | Open tutor request queue if available, or describe teacher support handoff. |
| Parent report fails | Show parent dashboard and summarize report purpose. |
| API is unavailable | Use public pages only: homepage, how it works, pricing, contact. |
| Network is slow | Stop live form submissions and use already-loaded pages. |

## Pages To Avoid Unless Needed

- Hidden advanced analytics routes.
- Placeholder admin pages.
- Internal debugging surfaces.
- Checkout result pages unless explaining payment handoff.
- Any route that has not been part of the final presentation path.

## Pre-Presentation Checklist

- [ ] API health checked.
- [ ] Frontend online.
- [ ] Student login works.
- [ ] Chat works.
- [ ] Parent report works.
- [ ] Tutor queue works.
- [ ] Contact form works.
- [ ] Browser zoom 100%.
- [ ] Language set correctly.
- [ ] Presenter has backup flow ready.

## Feedback Collection

After the presentation, capture:

- Audience type.
- Pages shown.
- Questions asked.
- Confusing terms.
- Broken or slow moments.
- Feature requests.
- Trust concerns.
- Follow-up owner.

Put future product ideas into the Phase 24 feedback/backlog process, not Phase 23.

