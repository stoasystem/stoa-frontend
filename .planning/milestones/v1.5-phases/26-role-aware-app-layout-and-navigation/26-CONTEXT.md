# Phase 26: Role-Aware App Layout and Navigation - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated during `$gsd-autonomous`

## Phase Boundary

Make authenticated navigation and user identity consistent across roles.

## Decisions

- AppLayout reads current auth user and renders a role-specific nav list.
- User menu owns logout navigation.
- Admin remains a placeholder.
