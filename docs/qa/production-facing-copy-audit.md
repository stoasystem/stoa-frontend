# Production-Facing Copy Audit

**Phase:** 18
**Created:** 2026-05-26
**Purpose:** Track user-visible development, demo, mock, test, placeholder, and internal wording before it reaches a production-facing STOA UI.

## Audit Rule

Normal user-facing UI must not expose development language. Demo infrastructure can remain in documentation, tests, local data contracts, backend helpers, and explicitly gated developer tooling.

## Prohibited In Normal UI

- `demo`, `Demo`, `for demo only`, `demo account`, `demo checkout`
- `mock`, `Mock`, `coming from mock data`, `mock checkout`
- `test account`, `Test account`
- `sample`, `Sample`
- `Codex`, provider/model names, `AI-generated demo`
- `fake`, `placeholder`, `temporary`, `under development`
- `development`, `staging`, `internal`, raw API mode names
- `admin accounts are not created publicly`
- `virtual checkout` when shown as a user action instead of an internal QA/dev note

## Allowed Locations

| Location | Allowed? | Notes |
|---|---:|---|
| `docs/` | Yes | Developer documentation and QA evidence can describe demo/mock/test infrastructure. |
| `README.md` | Yes | Setup and architecture docs can mention demo backend behavior. |
| `tests/` | Yes | E2E names and fixtures can reference demo users and virtual checkout. |
| `backend/` | Yes | Local backend and seed data can retain demo terminology. |
| `src/data/*MockData.ts` | Yes if not rendered raw | Internal fallback data may keep mock variable names; rendered labels still need mapping. |
| `src/services/**` | Yes if not rendered raw | Internal helper and API fallback names can remain. |
| `src/i18n/locales/**` | No for normal UI keys | Locale values are user-visible unless they are explicitly gated internal/developer copy. |
| `src/pages/**`, `src/components/**`, `src/layouts/**` | No for normal UI text | Hardcoded copy must be product-facing or gated. |
| `src/app/router/routeConfig.ts` | Mixed | Internal statuses can remain, but route descriptions/purpose must not render raw. |

## Baseline Scan

Command used:

```bash
rg -n "demo|Demo|mock|Mock|test account|Test account|sample|Sample|staging|development|Codex|fake|Fake|placeholder|Placeholder|temporary|not created publicly|for demo only|under development|coming from mock data|virtual checkout|Virtual checkout" src docs README.md tests .env.example package.json
```

## Source Inventory

| Category | Examples | Phase 18 handling |
|---|---|---|
| User-visible locale copy | `src/i18n/locales/*/auth.json`, `billing.json`, `pricing.json`, `admin.json`, `home.json` | Rewrite or gate in Phase 105. |
| User-visible hardcoded components/pages | `src/pages/organization/OrganizationDashboardPage.tsx`, billing checkout pages, auth/register components | Rewrite, gate, or map in Phases 104-106. |
| Route metadata | `src/app/router/routeConfig.ts`, `src/lib/navigation.ts` | Keep internal route statuses; prevent raw `demo`/`placeholder` descriptions from normal UI. |
| Internal fallback/service identifiers | `src/services/**`, `src/data/*MockData.ts` | Preserve code identifiers; map rendered labels before display. |
| Tests and fixtures | `tests/e2e/**` | Preserve if they are explicit local/demo QA flows. |
| Documentation | `docs/**`, `README.md` | Preserve when documenting developer/demo boundaries; update README with Phase 18 rules. |

## Route Priority

| Priority | Routes/pages | Audit requirement |
|---|---|---|
| P0 | `/`, `/login`, `/register`, `/onboarding`, `/chat`, `/pricing`, `/billing`, `/parent/children/:childId/report`, `/tutor`, `/support` | Must not show prohibited wording in normal mode. |
| P1 | `/parent`, `/parent/**`, `/tutor/**`, `/admin`, `/admin/**`, `/support/**`, `/billing/**` | Must be cleaned or gated. |
| P2 | Organization, learning intelligence, partnership, advanced analytics, retention, future password recovery | May remain hidden or explicitly gated if not cleaned in Phase 18. |

## Current High-Risk Findings

| Area | Finding | Planned phase |
|---|---|---|
| Auth locale copy | `demoTitle` values remain in EN/DE/FR/IT auth locale files. | 104, 105 |
| Billing locale copy | EN/DE/FR/IT billing and pricing locale files mention demo/mock/virtual checkout. | 104, 105 |
| Home/admin locale copy | DE/IT home/admin locale strings still mention demo-ready/admin demo operations. | 105 |
| Route metadata | Route statuses and descriptions include `demo` and `placeholder`; acceptable internally but unsafe if rendered raw. | 104, 105 |
| Data labels | `Mock checkout completed` appears in analytics fallback data. | 105 |
| Organization pages | Some P2 route copy describes frontend-only demo surfaces. | 104, 105 |
| Checkout E2E | Virtual checkout tests depend on demo route behavior. | 104, 107 |

## Approval Matrix

| Route | Page | Issue found | Fix applied | Approved |
|---|---|---|---|---|
| `/` | Homepage | Locale copy contained demo-ready wording. | Rewritten as product-facing trust copy. | Yes |
| `/login` | Login | Local account shortcuts could appear in normal mode. | Gated by `showDemoAccounts`; shortcut label no longer says demo account. | Yes |
| `/register` | Register/onboarding | Role setup copy mentioned onboarding path and admin-account rules. | Rewritten as account setup and role-specific product copy. | Yes |
| `/chat` | Chat | Provider/mock terminology must stay backend/internal. | User-facing copy and errors use Learning Assistant and sanitized messages. | Yes |
| `/parent/children/:childId/report` | Parent report | Sample/demo labels must not render. | Parent report copy remains supportive and product-facing. | Yes |
| `/tutor` | Tutor dashboard | Raw request statuses could render. | Teacher-help statuses render through `SafeStatusLabel`. | Yes |
| `/pricing` | Pricing | Virtual/mock checkout copy needed product-safe wording. | Rewritten as plan selection/contact wording. | Yes |
| `/billing` | Billing | Demo/mock checkout strings visible in locale copy. | Rewritten as plan-selection wording; preview gated by environment. | Yes |
| `/support` | Support | Support copy and errors needed user-facing state audit. | Ticket copy, empty states, and errors are product-facing. | Yes |
| `/admin` | Admin | Admin operational demo labels needed gating or product wording. | Admin copy cleaned; advanced/demo routes gated. | Yes |

## Final Phase 18 Evidence

Commands run:

```bash
npm run build
npm run dev -- --host 127.0.0.1
rg -n "demo|Demo|mock|Mock|test account|Test account|sample|Sample|Codex|fake|Fake|placeholder|Placeholder|development|virtual checkout|Virtual checkout|not created publicly" src/i18n/locales src/pages src/components
rg -n "status\\.replace|>\\{[^\\n}]*\\.status\\}|ticket\\.status|request\\.status|record\\.status|item\\.status|node\\.status|attachment\\.status" src/components src/pages
```

Result:

- `npm run build` passed.
- `npm run dev -- --host 127.0.0.1` started successfully after sandbox escalation and showed `http://127.0.0.1:5173/`.
- Remaining prohibited-term source hits are internal key names, HTML placeholder attributes, internal imports, gated internal debug UI, and internal analytics identifiers rather than normal-mode rendered copy.
- Remaining raw-status scan hits are comparisons/filtering or `SafeStatusLabel` call sites rather than direct user-visible raw labels.
- Milestone integration audit found and fixed late leaks in admin diagnostics, support/billing operational copy, checkout result plan labels, register/chat/file-upload error paths, and chat fallback response copy.
- Follow-up scan confirms remaining `backend`/`API` hits in `src/pages`, `src/components`, `src/hooks`, `src/services`, and `src/i18n/locales` are internal variable names, guarded debug UI, logging/HTTP internals, or non-rendered service identifiers.

## Completion Criteria

- P0/P1 normal-mode runtime UI has no prohibited wording.
- Prohibited wording that remains in `src/` is either internal-only, gated, test-only, or developer documentation.
- EN/DE/FR/IT changed locale keys are updated together.
- Raw internal statuses are mapped before rendering.
- Evidence is recorded in Phase 107.
