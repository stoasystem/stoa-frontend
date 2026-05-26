# Phase 22 Research: Pitfalls

**Milestone:** v1.21 Phase 22

## Scope Pitfalls

- Adding product features while preparing the demo.
- Reworking the homepage, register flow, language system, or visual direction.
- Treating unresolved polish feedback as a reason for broad redesign.
- Adding complex backend, AWS, database, payment, or support infrastructure.

Prevention:

- Requirements must state that Phase 22 does not expand product scope.
- P0/P1/P2/P3 triage decides what is fixed now versus moved to known issues or backlog.
- Launch-candidate branch rules allow bug fixes only.

## Demo Reliability Pitfalls

- Demo accounts drift from documented credentials.
- Reset does not restore expected conversations, reports, requests, support tickets, or admin data.
- A previous demo changes state and breaks the next demo.
- Demo scripts include routes that are placeholders or not stable enough for the audience.
- Demo backend failure has no fallback explanation.

Prevention:

- Document fixed accounts and data expectations.
- Run reset before final demo and record whether data returns consistently.
- Scripts should include pages to avoid.
- Troubleshooting docs should cover backend, auth, language switcher, contact form, and mobile layout failures.

## Review Pitfalls

- Stakeholder review becomes vague feedback with no decision.
- Investor review focuses on unfinished settings/admin internals.
- Parent review sees operational jargon instead of trust and visibility.
- Tutor review implies teachers are being replaced.
- Admin review exposes unfinished internal details.

Prevention:

- Use role-specific checklists and scripts.
- Classify review outcome as Approved, Approved with minor fixes, Needs revision, or Blocked.
- Keep each demo narrative audience-specific.

## Lock Pitfalls

- Copy changes happen in one language only.
- German headings become long again.
- French apostrophes or CTA wrapping regress.
- Design lock is bypassed by last-minute UI tweaks.
- API contract changes happen without synchronized frontend, demo backend, and docs updates.

Prevention:

- Copy, design, translation, and API locks must define allowed post-lock changes.
- Four-language checks are required for text changes.
- Contract changes require demo flow retesting.

## Launch Candidate Pitfalls

- Creating a release branch before build/core demo checks pass.
- Putting P0 issues into known issues.
- Accepting P1 issues without a workaround.
- Release notes overstate production readiness.
- User-visible demo/mock/provider/Codex wording reappears.

Prevention:

- Launch-candidate approval checklist must gate branch creation.
- Known issues rules must explicitly exclude P0 issues.
- Release notes should describe demo/backend mode and limitations plainly.
- Final scans should include user-visible internal terminology.

