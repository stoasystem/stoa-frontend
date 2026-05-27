# Quick Task: Remove Practice Detail Repeated Goals

Date: 2026-05-27

## Problem

After entering a subject Practice Path page, the detail page repeats the Daily goal and Study streak cards that already belong on the `/practice` subject overview.

## Scope

- Remove Daily goal and Study streak cards from `/practice/:subjectId/:topicId`.
- Keep those cards on the `/practice` overview page.
- Verify the Mathematics detail page starts with the Practice Path detail instead of repeated summary cards.

## Verification

- Browser check `/practice/mathematics/equations`.
- `npm run lint`
- `npm run build`
