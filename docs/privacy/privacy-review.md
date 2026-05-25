# STOA Privacy Review

Phase: 46 privacy, backup, pricing, and billing preparation
Status: pilot draft

## Scope

This review covers the frontend privacy posture for pilot use only. It supports PRIV-01,
PRIV-02, and PRIV-03 by documenting what the current pilot pages disclose, what is not
yet finalized, and what must happen before production launch.

## Current Pilot Disclosures

- `/privacy` now describes account data, role relationships, learning activity, uploads,
  tutor help requests, parent summaries, technical records, and backup retention at a
  pilot-draft level.
- `/terms` now describes pilot access, account resets, AI output limitations, user
  responsibilities, and billing preparation without creating payment obligations.
- `/pricing` and `/billing` explicitly state that paid checkout, subscription
  enforcement, payment methods, invoices, and production billing terms are not active.

## Data Categories To Confirm Before Production

- Account and authentication records.
- Student questions, AI responses, tutor notes, file uploads, learning history, and
  parent-visible summaries.
- Feedback submissions and support records.
- Security, audit, and operational logs.
- Backup snapshots and point-in-time recovery records.

## Open Legal And Product Decisions

- Production retention periods for account, learning, upload, log, and backup records.
- Deletion, correction, export, parent consent, and account closure workflows.
- Processor list and regional privacy requirements for target pilot and launch markets.
- Whether any school, child privacy, or education-record obligations apply to a given
  customer deployment.
- Billing provider, plan terms, tax handling, cancellation policy, and refund policy.

## Phase 46 Outcome

The frontend now has pilot-grade privacy and terms drafts instead of generic placeholders.
These drafts are suitable for internal review and controlled pilot testing, but they are
not final production legal documents.
