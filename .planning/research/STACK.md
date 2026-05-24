# Project Research: Stack for v1.6 Phase 7

**Milestone:** v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness
**Date:** 2026-05-25

## Summary

Phase 7 should keep the existing React, TypeScript, Vite, TailwindCSS, local UI primitives, React Router, TanStack Query, Axios, and Zustand foundation. The stack additions should be small and focused on readiness gaps: toast notifications, schema-backed validation, an error boundary helper, environment flags, and a thin analytics client.

## Recommended Stack Additions

- `sonner` for toast notifications. Its React API centers on adding a `<Toaster />` once and calling `toast()` from app code.
- `zod` for shared validation schemas.
- `react-hook-form` plus `@hookform/resolvers` if forms are refactored beyond simple local state. The official resolver package supports `zodResolver(schema)`.
- `react-error-boundary` or a local class-based boundary. React docs still treat error boundaries as the mechanism for catching render errors in child trees.
- No analytics vendor yet. Use `trackEvent()` as a local abstraction and optionally prepare `POST /analytics/events`.

## Existing Stack To Reuse

- TailwindCSS utilities and existing local UI primitives for page polish.
- React Router for adding `/parent/children/:childId/report`.
- TanStack Query for parent report and tutor workflow data.
- Existing local FastAPI + SQLite backend for seed report, analytics event, and teacher note test data.

## What Not To Add

- No full design system migration.
- No complex BI/analytics dashboard.
- No production deployment platform integration.
- No payment or admin expansion.
- No vendor-specific analytics coupling before MVP feedback proves the need.

## Sources

- Sonner npm docs: React toast usage is `<Toaster />` plus `toast()`.
- React Hook Form docs: form validation API focuses on low re-render form state.
- `@hookform/resolvers` docs: supports Zod through `zodResolver`.
- Zod docs: string min/email and enum validations cover Phase 7 schemas.
- React and React Router docs: error boundaries are the right fallback mechanism for render errors.
