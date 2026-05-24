# Phase 25: Tutor Help Request Workflow - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated during `$gsd-autonomous`

## Phase Boundary

Add tutor dashboard and help-request detail/status workflow.

## Decisions

- Tutor can view pending or assigned requests returned by backend policy.
- Tutor status updates go through `PATCH /tutors/me/help-requests/:requestId`.
