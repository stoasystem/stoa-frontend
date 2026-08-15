---
milestone: v9
audited: 2026-08-15
audit_timestamp_utc: 2026-08-15T08:07:48Z
status: gaps_found
decision: HOLD
scope: current frontend source, v9 planning evidence, backend contract integration, tests, build, dependencies, security controls, and enabled product surfaces
predecessor: .planning/milestones/v9-MILESTONE-AUDIT.md
source_snapshot:
  frontend: 87330e943f89b9b6597c84845684afce34d99507
  frontend_origin_main: 87330e943f89b9b6597c84845684afce34d99507
  backend_current: 4d85a9d10580152ce64ecb096132de632918f699
  backend_runtime_tested: 51594ae765c5529028ff0ebf49777afd1a1f0e6d
scores:
  requirements_checked_in: 24/24
  requirements_strict_three_source_satisfied: 0/24
  requirements_locally_wired_to_current_intent: 11/24
  requirements_documentary_or_historical_only: 9/24
  requirements_unwired: 2/24
  requirements_directly_violated: 2/24
  phases_historically_marked_pass: 6/6
  phases_independently_verified_for_current_head: 0/6
  product_flows_complete: 1/12
  product_flow_steps: 26/50
  security_artifacts: 0
  ui_spec_artifacts: 0
  ui_review_artifacts: 0
nyquist:
  status: disabled
  compliant_phases: []
  partial_phases: []
  not_assessed_phases: [298, 299, 300, 301, 302, 303]
gaps:
  requirements:
    - id: SCOPE-01,SEO-04
      status: violated
      evidence: Current router maps `/` to HomeV2Page, exposes no `/home-v2`, and removed the classic homepage without the required switch-over authority.
    - id: SCOPE-02,SEO-03
      status: unwired
      evidence: The required preview route and future canonical/sitemap/old-home/rollback runtime path do not exist.
    - id: SCOPE-01..04,LAYOUT-01..05,LEGAL-01..04,SEO-01..04,ASSET-01..03,VERIFY-01..04
      status: orphaned
      evidence: All six SUMMARY files omit requirement frontmatter and all six VERIFICATION files omit requirement IDs and expanded requirement tables.
  integration:
    - Public Teacher registration, pending review, administrator activation, and Teacher access are not wired.
    - Login-code, refresh, safe return, and backend global logout are not consumed by the Web client.
    - Upload, memory, streaming chat, attachments, and Teacher-help status disagree with backend routes or request schemas.
    - Enabled Question Bank, Classroom, assistant, upload, profile, and payment settings surfaces expose mock, static, or fake data.
  security:
    - Legacy tutor aliases and unknown-role-to-student fallback violate fail-closed role authority.
    - WebSocket bearer token and caller-provided identity are placed in the URL query.
    - Current npm audit reports four high and one moderate vulnerability.
---

# STOA Frontend Full Work Audit — 2026-08-15

## 1. Decision

The frontend is **HOLD** for real-user early testing, staging acceptance, beta,
or any claim of current product completion.

The repository has a substantial route and page surface, a strong fail-closed
served-release bootstrap, and a currently green lint/type/release/build
foundation. Those strengths do not establish a truthful product. Multiple
enabled routes return deterministic 404/422 responses, use incompatible request
schemas, fabricate success or personally identifying data, or never cross the
real backend boundary.

The v9 Home V2 presentation subset also cannot retain its historical milestone
PASS for the current HEAD. v9 explicitly prohibited replacing `/`, required a
`/home-v2` preview, and required a separately approved switch-over stage. Current
source replaced `/`, removed `/home-v2`, and deleted the classic homepage without
a checked-in switch-over authority or rollback successor.

This is a forward-only successor to the historical v9 audit. It does not rewrite
the six historical phase summaries/verifications or infer that their old browser
receipts are false. It records that they are insufficient for the current source.

The latest cross-repository product authority remains binding:

- public registration offers `student`, `parent`, and `teacher`;
- a Teacher verifies email, then remains `pending_review` without Teacher
  authority until administrator approval;
- `teacher` is the only active role term; no `tutor` alias, field, route, fixture,
  or unknown-role fallback is retained in runtime contracts;
- invitation/token activation is not the active onboarding model;
- Phase 477 remains paused and this audit does not authorize implementation,
  planning, provider access, or deployment.

No product source, dependency version, route, test, or runtime configuration was
changed during this audit. The pre-existing untracked
`public/mockServiceWorker.js` was preserved and remains untracked.

## 2. Source And Evidence Custody

| Item | Audited value | Interpretation |
| --- | --- | --- |
| Frontend HEAD | `87330e943f89b9b6597c84845684afce34d99507` | `main == origin/main`, 0 ahead / 0 behind |
| Frontend worktree | only untracked `public/mockServiceWorker.js` | Pre-existing, inert in current tests, untouched |
| Backend current HEAD | `4d85a9d10580152ce64ecb096132de632918f699` | The latest commit is a documentation-only project audit successor |
| Backend runtime tested | `51594ae765c5529028ff0ebf49777afd1a1f0e6d` | Runtime source/tests/workflows are unchanged between the tested runtime and current backend documentation commit |
| Historical frontend v9 evidence source | `4561e786` | Plans, summaries, verifications, and audit were committed together; not an independent current-HEAD verifier |
| Historical raw browser evidence | `/private/tmp/stoa-home-v2-v9/` | No longer exists; only report summaries remain |

Git synchronization proves source custody only. It does not prove frontend/backend
semantic integration or a deployable release set.

## 3. Audit Method And Evidence Levels

The audit applied the milestone three-source rule to every requirement:

1. checked requirement and traceability entry in `REQUIREMENTS.md`;
2. `requirements-completed` in phase SUMMARY frontmatter;
3. an expanded requirement/evidence table in phase VERIFICATION.

It then checked current router → page → hook → service → backend route/schema
wiring, current test/build results, dependency advisories, and the behavior of
enabled mock/static/fallback surfaces.

| Evidence level | Meaning | Current frontend result |
| --- | --- | --- |
| L0 | Page, route, plan, or source exists | Broadly present |
| L1 | Isolated lint/type/unit/release/build gate passes | Strong static/release foundation; component suite red |
| L2 | Frontend and backend execute the same contract without replacing the boundary under test | Not achieved for a complete critical role journey |
| L3 | Deployed/sandbox browser journey proves identity, provider, failure, and retry behavior | Not achieved |
| L4 | Same-candidate staging release, smoke, degradation, and rollback evidence | Not achieved |

## 4. Frontend Work Inventory

| Inventory | Count | Notes |
| --- | ---: | --- |
| `src` files | 667 | Current source tree, excluding tests/docs |
| Page modules | 92 | 86 `src/pages` TSX plus 6 feature page modules |
| Concrete routes | 104 | 105 route declarations including wildcard |
| Service modules | 53 | 51 `src/services` plus 2 feature services |
| Hooks | 116 | 105 `src/hooks` plus 11 feature hooks |
| Store modules | 1 | Central auth store; additional server state is mostly TanStack Query |
| Test files | 44 | Component, E2E, release, setup, helper, and mock assets |
| Component test files | 5 | Vitest collects only `tests/component` |
| E2E assets | 29 specs plus helper | 106 declared tests; predominantly intercepted/demo-oriented |
| Release tests | 53 | 35 runtime/release plus 18 verifier tests |

The broad inventory is useful for ownership. It is not a completion score.

## 5. v9 Planning And Three-Source Requirement Audit

### 5.1 Exact artifact state

| Artifact | Count / status |
| --- | ---: |
| Current v9 phases | 6: 298–303 |
| CONTEXT / PLAN / SUMMARY / VERIFICATION | 6 / 6 / 6 / 6 |
| Unique requirements | 24 |
| Roadmap requirement count | 25 because `SCOPE-04` is mapped twice |
| Checked requirements | 24/24 |
| SUMMARY files with requirement frontmatter | 0/6 |
| Requirement IDs claimed by SUMMARY files | 0/24 |
| VERIFICATION files with requirement tables/IDs | 0/6 |
| Strict three-source satisfied | 0/24 |
| Strict orphaned/unsatisfied | 24/24 |
| Historical phase-level `Pass` | 6/6 |
| Current-HEAD independent phase verification | 0/6 |
| VALIDATION / SECURITY / UI-SPEC / UI-REVIEW | 0 / 0 / 0 / 0 |

Strict `0/24` does not mean all source is absent. It means the checked traceability
table cannot be corroborated from the other two required sources.

### 5.2 All 24 requirements

Every SUMMARY and VERIFICATION column is `missing` below. The current-source
column distinguishes local implementation from evidence sufficiency.

| Requirement | Phase | REQUIREMENTS | SUMMARY | VERIFICATION | Current source / intent | Final audit status |
| --- | ---: | --- | --- | --- | --- | --- |
| SCOPE-01 | 298 | checked | missing | missing | `/` now serves Home V2 | ORPHANED and directly violated |
| SCOPE-02 | 298 | checked | missing | missing | `/home-v2` route absent | ORPHANED and unwired/violated |
| SCOPE-03 | 298 | checked | missing | missing | Backlog source exists as documentation | ORPHANED; documentary only |
| SCOPE-04 | 298,303 | checked | missing | missing | Historical non-launch decision exists but was bypassed | ORPHANED; decision no longer governs source |
| LAYOUT-01 | 299 | checked | missing | missing | FR mobile fixes remain in Home V2 source | ORPHANED; current screenshots absent |
| LAYOUT-02 | 299 | checked | missing | missing | FR/IT title-fit source remains | ORPHANED; current screenshots absent |
| LAYOUT-03 | 299 | checked | missing | missing | Mobile Hero styling remains | ORPHANED; current screenshots absent |
| LAYOUT-04 | 299 | checked | missing | missing | CTA resilience source remains | ORPHANED; current screenshots absent |
| LAYOUT-05 | 299 | checked | missing | missing | Navigation visibility source remains | ORPHANED; current screenshots absent |
| LEGAL-01 | 300 | checked | missing | missing | Public draft/review framing remains removed | ORPHANED; current browser evidence absent |
| LEGAL-02 | 300 | checked | missing | missing | Legal copy avoids finality claim | ORPHANED; current browser evidence absent |
| LEGAL-03 | 300 | checked | missing | missing | Internal legal notes remain documented | ORPHANED; documentary only |
| LEGAL-04 | 300 | checked | missing | missing | Locale rendering source remains | ORPHANED; current browser evidence absent |
| SEO-01 | 301 | checked | missing | missing | Default product metadata is wired | ORPHANED; locally wired only |
| SEO-02 | 301 | checked | missing | missing | Home/legal `Seo` component path is wired | ORPHANED; locally wired only |
| SEO-03 | 301 | checked | missing | missing | Switch-over plan is documentation; no canonical/sitemap/rollback runtime | ORPHANED and unwired |
| SEO-04 | 301 | checked | missing | missing | Current source switched Home V2 to `/` | ORPHANED and directly violated |
| ASSET-01 | 301 | checked | missing | missing | Temporary approval is self-recorded documentation | ORPHANED; owner provenance not independently retained |
| ASSET-02 | 301 | checked | missing | missing | Future final imagery requirement is documented | ORPHANED; documentary only |
| ASSET-03 | 301 | checked | missing | missing | No new violation observed in current tree | ORPHANED; current provenance manifest absent |
| VERIFY-01 | 302 | checked | missing | missing | Historical Home V2 screenshot summary only | ORPHANED; raw evidence unavailable/current target changed |
| VERIFY-02 | 302 | checked | missing | missing | Historical legal rendering summary only | ORPHANED; raw evidence unavailable |
| VERIFY-03 | 302 | checked | missing | missing | Current lint/build pass; stale Home V2 E2E contradicts router | ORPHANED; current acceptance incomplete |
| VERIFY-04 | 302 | checked | missing | missing | Required temporary raw-evidence directory no longer exists | ORPHANED; custody unavailable |

Source-intent classification is therefore:

- 11 requirements have current local presentation wiring;
- 9 are documentary or historical-only;
- 2 are unwired (`SCOPE-02`, `SEO-03`);
- 2 are directly violated (`SCOPE-01`, `SEO-04`);
- all 24 remain strict three-source orphans until a forward current-HEAD
  verification successor exists.

### 5.3 Phase evidence

| Phase | Historical artifact | Current audit result |
| --- | --- | --- |
| 298 Scope | three-line `Pass` verification | Current `/` switch directly defeats the frozen boundary |
| 299 Responsive | references Phase 302 browser audit | Home V2 changed after v9; no current screenshot/reflow verification |
| 300 Legal | three-line `Pass` verification | Source substantially remains, but no requirement-level or current raw render evidence |
| 301 SEO/rollback | three-line `Pass` verification | Metadata remains; route preservation and rollback conditions are violated/unimplemented |
| 302 Verification | records lint/build/E2E 5/5 | Raw evidence is gone and test targets now contradict current router |
| 303 Decision | three-line `Pass` verification | “Ready for switch-over planning” was bypassed by an unapproved actual switch |

All plans, summaries, verifications, and the historical audit were introduced in
the same `4561e786` commit. The historical milestone audit is 34 lines with no
YAML status, scores, requirement matrix, or integration result. It remains a
historical summary, not independent current evidence.

### 5.4 Nyquist, security, and UI evidence

- Nyquist is explicitly disabled in `.planning/config.json`; it is **not
  assessed**, not compliant.
- The security post-hook is configured, but no current or historical
  `SECURITY.md` artifact exists.
- UI workflow is enabled, but Phases 299 and 302 have neither `UI-SPEC.md` nor
  `UI-REVIEW.md`.
- Absence of artifacts means the corresponding audit did not happen or was not
  retained. It cannot mean “no issue found.”

## 6. Planning And Codebase Authority Drift

| Authority | Current statement | Conflict |
| --- | --- | --- |
| `ROADMAP.md` milestone checkbox | v9 active and unchecked | Same file marks all six phases complete and says v9 is in execution |
| `STATE.md` | v9 complete, 100% | Conflicts with ROADMAP active state and current source violations |
| `PROJECT.md` | v9 shipped; current milestone None | Active section still says finish v9 and preserve `/` |
| `MILESTONES.md` | v9 Complete | Historical completion is not current-HEAD verification |
| GSD initializer | 6/6 complete | Counts plans/summaries; does not detect source/authority drift |

The planning corpus contains about 1,050 tracked files and 54 milestone audits.
Current GSD archive discovery reports zero archives despite `.planning/milestones`
containing 31 phase directories and 99 top-level files.

`AGENTS.md` and `.planning/codebase/` are materially stale. They still describe
an early shell without tests, ESLint config, route guards, CSS, design system,
queries, CI, staging configuration, or feature API consumers. Current source has
667 files, Vitest, Playwright, release verification, protected routes, broad
services/hooks, and a large design/product surface. These maps can no longer be
used as implementation authority.

Active planning prose also retains many current `tutor` descriptions. Historical
terminology may remain as history, but it must be separated from active runtime
and planning authority.

## 7. Current Product Surface Audit

### 7.1 Route and role surface

| Surface | Routes | Current truth |
| --- | ---: | --- |
| Public/Auth | 21 | Marketing/legal plus auth, support/contact, onboarding, and synthetic assistant |
| Shared token-only | 7 | Billing/referrals/support; token presence is checked without business-role restriction |
| Student | 26 | Dashboard/chat/classroom/practice/question-bank/profile/history |
| Parent | 8 | Children, reports, summary/progress/history/account |
| Organization | 13 | Most demo-gated; learning operations/automation are not consistently gated |
| Teacher | 9 | All remain under `/tutor...` despite canonical `teacher` authority |
| Admin | 20 | Broad operations; some adapters/targets are absent or placeholder |

`ProtectedRoute` checks token presence. `RoleRoute` relies on the client store.
The store accepts `tutor`, `tutors`, and `teachers`, and maps unknown roles to
`student`. That is an authorization-boundary defect: parsing errors must fail
closed, not grant a different role surface.

### 7.2 Domain matrix

| Domain | Real implementation | Current gap | Result |
| --- | --- | --- | --- |
| Public/Home | Home V2 component/SEO render; marketing/legal pages | `/` switched without authority; `/assistant` fabricates AI and booking success; contact/partnership backend gaps | P0 |
| Registration | Form, verification panel, resend/confirm clients | Terms fields make backend Student/Parent registration 422; backend rejects Teacher; credential endpoint absent; no pending-review/admin activation | P0 |
| Login/session | Password login and current-user query | Forgot-password page is a placeholder; no login-code UI, refresh consumer, safe return, backend logout, or pending/rejected Teacher state; logout is local-only | P0 |
| Roles | Protected/Role route components | Tutor aliases and unknown→Student fallback; Teacher routes still `/tutor` | P0 |
| Student dashboard | Real hooks mixed with dashboard presentation | Statistics/recent questions/feedback include static data | P0 truth gap |
| Student profile | Real profile request | Real response is merged with fake Anna/Martin/guardian/billing PII | P0 |
| Chat/AI | Real conversation list/message/stream endpoint calls | Stream omits `idempotencyKey`, sends string attachment IDs, retry does not preserve key; public assistant/useMockChat are fake | P0 |
| Files | Legacy multipart upload and feature upload UI | Backend requires intent/chunk/complete; non-chat feature upload always fakes success | P0 |
| Memory | Memory/recommendation hooks | Calls `/students/me/memory` instead of `/adaptive/students/me/memory` | P0 |
| Teacher help | Request and polling hooks | Polls nonexistent GET; mock component test validates wrong service contract | P0 |
| Practice | Many backend paths align | No generated schema lane; mock fallback architecture remains; result can use mock lesson | P1 |
| Question Bank | Eight core/P0/P1 routes | Entire service is in-memory mock | P0 |
| Classroom | Nine Student/Teacher entries | Entire service is in-memory mock and routes are not demo-gated | P0 |
| Parent | Significant `/parents/me/*` route alignment | Monthly report absent; browser proof intercepted; some reports/static catalog drift | P1 |
| Teacher | Some `/teachers` request/detail paths align | No real queue/takeover/reply consumption; missing profile; field drift `tutor` vs `teacher`; no review state | P0 |
| Admin | Curriculum/report/subscription/account/billing recovery have reusable paths | Analytics/usage/feedback/help/support target missing APIs; users page placeholder; no Teacher review UI | P1 |
| Organization | DemoSurfaceRoute pattern on many routes | Backend organization family absent; two routes remain insufficiently gated | P1 |
| Billing | Command UUID, idempotency header, session successor core align | Any token can enter Parent billing; plan catalog duplicated; Payment Settings hard-codes identity/email/Visa 4242 | P0 |
| Notifications | REST list/read/archive largely align | Preferences/digest/push unconsumed; realtime token/user/role placed in query | P1 security |
| Release/config | Served-release digest, schema, loader, startup barrier are strong | Business flags are declared but do not gate many routes/navigation/actions | Preserve foundation; P0 product gating gap |
| Accessibility | Math escaping, some live regions and startup alerts | No axe/jsx-a11y gate; incomplete keyboard/focus/pressed semantics | P2 |

## 8. Backend Contract Integration

### 8.1 Deterministic route/schema breaks

| Frontend call | Backend truth | Effect |
| --- | --- | --- |
| register with `acceptedTerms`, `termsVersion`, `acceptedAt` | `RegisterRequest` forbids extras and allows only Student/Parent | Student/Parent 422; Teacher invalid |
| `POST /files` multipart | `/files/intents`, chunks, complete, attachment inventory | Upload 404 / incompatible lifecycle |
| `/files/tutor-credentials` | No route | Teacher registration upload 404 |
| `/students/me/memory` | `/adaptive/students/me/memory` | Memory/recommendation 404 |
| stream body `{content, attachmentIds}` | Required `idempotencyKey` and typed `AttachmentReference` | Streaming request 422; retry semantics invalid |
| `GET /teacher-help/request/:id` | Backend exposes availability GET and request POST, no status GET | Polling 404 |
| `/teachers/me/profile` | No backend route | Teacher profile 404 |
| `firstTutorActionAt` and `tutor` fields | Backend emits `firstTeacherActionAt` and `teacher` | Silent missing data/render drift |

Additional active callers target missing contact, support-ticket, referral,
organization, learning-history/monthly-report, analytics-event, frontend-error,
and selected admin API families.

### 8.2 Backend capabilities not consumed

- refresh and global logout;
- upload intent/chunk/complete and saved attachment inventory;
- adaptive assignment start/complete/skip/archive;
- question detail/feedback/report/request-teacher;
- Teacher queue, dispatch, takeover, reply, and resolve;
- notification preferences/digest/push-token lifecycle;
- `/admin/users` real backend capability.

## 9. Current Engineering Gates

All current commands below ran against frontend
`87330e943f89b9b6597c84845684afce34d99507` during this audit.

| Gate | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `npm run lint` | PASS | ESLint source baseline | API correctness or browser behavior |
| app TypeScript no-emit | PASS | Application type consistency | Runtime schema compatibility |
| node TypeScript no-emit | PASS | Node/tooling type consistency | Release execution |
| Vitest TypeScript no-emit | PASS | Test project type consistency | Tests execute successfully |
| `npm run test:release` | 35/35 PASS | Runtime config, projection, startup barrier, served-release contracts | Product route/action gating or backend journeys |
| release verifier suite | 18/18 PASS | Closed five-step verifier contract | Current immutable staging receipt |
| production build | PASS, 2659 modules | Bundle is buildable | Live startup/API/provider behavior |
| main App chunk | 753.11 kB minified | Current bundle measurement | Performance under real network/device |
| component suite | 2 suites failed; 3 suites/27 tests passed | Three isolated component areas pass | Chat suites fail on auth store import because `localStorage.getItem` is unavailable |
| broad Playwright | NOT RUN | No current claim | Existing harness uses ignored `VITE_*` startup flags and extensive route interception |
| MSW | server/handlers exist but no suite starts it | Mock assets exist | Live contract proof; several handlers encode wrong paths/bodies |
| `npm ls --depth=0` | PASS | Installed tree is internally resolvable | Advisory safety |
| `npm audit --omit=dev --audit-level=high` | FAIL: 5 vulnerabilities, 4 High and 1 Moderate | Current registry advisory result | Route-specific reachability or safe automated upgrade |
| worktree check | only pre-existing untracked worker | Audit commands did not change tracked source | Whether worker should later be removed |

The first in-sandbox component attempt failed with EPERM while Vite tried to
write a temporary bundled config under `node_modules`. The authoritative rerun
outside that restriction started normally and reproduced the real two-suite
`authStore`/`localStorage` failure.

### Dependency findings

| Package/path | Installed | Classification |
| --- | ---: | --- |
| direct production `axios` | 1.16.1 | Current audit reports High advisories including recursion/DoS, prototype-derived request construction, upload-bound bypass, and proxy/auth behavior |
| direct production `react-router-dom` → `react-router` | 7.15.1 | Current audit reports High router advisories including open redirect and additional RSC/route-matching issues; SPA reachability must be classified, not assumed |
| Vite → PostCSS | 8.5.15 | Current audit reports a High source-map path disclosure issue; build-tool reachability differs from browser runtime |
| PostCSS → nanoid | 3.3.12 | Current audit reports High generator loop issues; transitive/build-path reachability requires classification |

`npm audit` reports fixes are available. No `npm audit fix`, lockfile rewrite, or
dependency install was authorized or performed. Upgrades need a reviewed minimal
version change plus lint/type/test/build/release regression evidence.

## 10. End-To-End Flow Audit

The integration checker scored **26/50 steps and 1/12 complete flows**. The one
complete local Home flow violates the frozen route authority, so it is not an
acceptable release flow.

| Flow | Score | Result | Primary break |
| --- | ---: | --- | --- |
| Public Home V2 | 4/4 | WIRED but unauthorized | `/` switch bypassed v9 boundary |
| Student/Parent registration + verify | 3/4 | PARTIAL | Real registration payload 422; verification ends at login |
| Teacher registration + admin activation | 1/5 | BROKEN | Credential path absent; backend rejects Teacher; no review/activation UI |
| Password recovery/login-code/refresh/logout/safe return | 1/5 | BROKEN | Password login only; recovery page is a placeholder and no complete session lifecycle exists |
| Student dashboard/memory | 2/4 | BROKEN | Wrong memory prefix and mixed static data |
| Upload/question/chat AI | 1/4 | BROKEN | Legacy upload and invalid streaming command |
| Teacher-help/queue/reply/resolve | 2/5 | PARTIAL/BROKEN | Student polling route absent; real Teacher workflow not consumed |
| Practice/lesson/mistake | 3/4 | PARTIAL | Significant route alignment, but no current integrated contract/browser proof |
| Parent/report/billing | 3/4 | PARTIAL | Real main paths; role/static/monthly-report/provider gaps |
| Admin retained operations | 2/4 | PARTIAL | Broad UI; placeholders and missing API families |
| Notifications/WebSocket | 2/4 | PARTIAL | REST partial; authenticated realtime path not proven |
| Release/runtime gating | 2/3 | PARTIAL | Strong bootstrap; business flags do not close enabled surface |

## 11. Security And Truth Controls

### Controls worth preserving

- closed, bounded, same-origin served-release and runtime-config loaders;
- startup barrier that imports the application only after valid runtime config;
- release secret/demo/native-field rejection and digest binding;
- public-path Authorization stripping and centralized HTTP error envelope;
- `DemoSurfaceRoute` as an explicit containment pattern;
- billing command UUID/idempotency/session successor core;
- MathRenderer malformed-input and script/markup escaping;
- startup error alert/live-region behavior.

### Open gaps

| Gap | Effect |
| --- | --- |
| unknown role → Student | Role parser fails open into a different protected surface |
| tutor aliases/routes/types | Preserves a rejected authority model and masks schema drift |
| token-only shared billing/support routes | Business-role authorization is delegated too late or not represented |
| WebSocket bearer/user/role query | Sensitive bearer can reach URLs/logs; caller-supplied channel identity is unsafe |
| fake PII and card display | Users can mistake fabricated guardian/financial data for account truth |
| enabled mock/static success | Product can report a successful action that never reached an authoritative service |
| inert/incorrect MSW handlers | Tests cannot detect live path/body drift and can normalize incorrect contracts |
| no frontend security artifact | Threat mitigations have never been aggregated for current v9/current HEAD |
| dependency advisories | Direct runtime and build-path packages need reachability/upgrade closure |
| no non-intercepted E2E lane | Authorization, cookies/tokens, schemas, errors, and provider failures remain unproven |

## 12. Severity-Ranked Findings

| ID | Severity | Finding | Required closure evidence |
| --- | --- | --- | --- |
| FE-001 | P0 | Home V2 replaced `/` without the required switch-over authority or rollback successor | Human decision: restore preview boundary or approve a forward switch-over successor; executable router/E2E proof |
| FE-002 | P0 | Public registration body is backend-invalid and latest Teacher review lifecycle does not exist | Generated contract tests and integrated Student/Parent/Teacher lifecycle |
| FE-003 | P0 | Password recovery is a placeholder and the session lifecycle lacks login code, refresh, safe return, backend logout, and fail-closed role restoration | Recovery/expiry/replay/coalescing/logout/provider-failure browser/API tests |
| FE-004 | P0 | Enabled assistant, Question Bank, Classroom, upload, dashboard/profile, and Payment Settings expose synthetic success or fake data | Disable/gate or connect; executable route inventory proves no enabled fake surface |
| FE-005 | P0 | Upload, memory, stream/idempotency/attachments, Teacher-help, Teacher profile, and response fields conflict with backend | One OpenAPI/adapter authority and negative contract lane |
| FE-006 | P0 | Business feature flags do not consistently gate routes, navigation, buttons, and mutations | Central route/action gate tests with all disabled combinations |
| FE-007 | P0 | Active tutor compatibility and unknown-role fallback violate binding role authority | Delete active aliases/routes/types/fixtures; unknown roles produce denied state |
| FE-008 | P1 | Component suite is red at auth store import | Green current component suite without environment-specific global assumptions |
| FE-009 | P1 | Current dependency audit reports four High and one Moderate vulnerability | Minimal reviewed upgrades, reachability record, lock diff, full regressions |
| FE-010 | P1 | v9 claims 24/24 while Summary/Verification evidence contains 0 requirement IDs | Forward requirement/evidence successor bound to current HEAD |
| FE-011 | P1 | Existing Playwright/MSW assets can pass while live requests fail | Runtime descriptor injection and at least one non-intercepted backend lane |
| FE-012 | P1 | Active adapters target absent public/growth/organization/analytics/monitoring/admin paths | Route-by-route enable/disable/backend ownership decision |
| FE-013 | P1 | WebSocket bearer and identity are placed in query parameters | Server-authenticated connection and channel authorization evidence |
| FE-014 | P1 | Billing role/catalog/payment truth is not closed | Parent-only route, one catalog authority, real explainable state, no fake PII |
| FE-015 | P1 | Router and route metadata are separate drifting sources | One executable route source or generated parity gate |
| FE-016 | P1 | AGENTS/codebase maps materially misdescribe the current repository | Regenerated current architecture/testing/integration maps |
| FE-017 | P2 | Accessibility evidence lacks axe/jsx-a11y and broad keyboard/focus checks | Automated semantic gate plus critical keyboard/focus browser cases |
| FE-018 | P2 | Main App chunk is 753.11 kB minified | Measured route-level split/performance budget if product performance requires it |
| FE-019 | P2 | Alternate Axios/Amplify and mock-chat truths remain despite the centralized client/runtime model | Consumer inventory and minimal deletion/extraction successor |

## 13. Keep, Disable, And Rebuild Classification

### Keep and extend

- served-release/runtime configuration, schema/digest validation, and startup
  barrier;
- `DemoSurfaceRoute` containment pattern;
- centralized HTTP client public-token stripping/error normalization;
- billing command/idempotency/session successor core;
- real-path portions of Practice, Parent, notification REST, admin curriculum,
  report, subscription, account, and billing-recovery adapters;
- MathRenderer escaping and fixed startup error UI.

### Disable or hide before any real-user test

- `/assistant`;
- all Question Bank and Classroom routes;
- `/billing/payment-settings`;
- non-chat fake uploads;
- contact/partnership/referral/support-ticket transaction UI without a real
  backend owner;
- Parent monthly report and missing admin analytics/usage/feedback/help/support;
- Teacher profile and current Teacher dashboard entry;
- Organization learning operations/automation not behind a real/demo gate;
- current registration mutations until the new exact contract is implemented;
- current Home V2 `/` mapping unless a human explicitly approves the successor.

### Rebuild against one authority

- exact Student/Parent/Teacher registration and administrator review;
- password recovery, login code, single coalesced refresh, safe return, and
  backend global logout;
- teacher-only role parsing, types, routes, fields, fixtures, and tests;
- upload intent/chunk/complete and typed attachments;
- streaming idempotency/retry key persistence;
- Teacher-help durable status and real Teacher queue/takeover/reply/resolve;
- exact Student profile DTO without merging fake data;
- route/navigation/action feature gating;
- generated OpenAPI/adapters plus non-intercepted integration/browser tests;
- one router/route-metadata and one pricing/catalog authority.

## 14. Recommended Closure Sequence

This sequence is a recommendation, not authorization to resume Phase 477.

### Gate 0 — Human authority decision

- Accept or amend this HOLD report.
- Decide whether `/` is restored to the classic page with `/home-v2` preview, or
  a forward switch-over successor explicitly approves the new Home V2 route.
- Freeze the latest public Teacher registration/admin-review and teacher-only
  authority in active planning.

Exit: no disputed route or role authority.

### Gate 1 — Honest surface containment

- Disable or demo-gate every synthetic, fake-PII, missing-backend, Question Bank,
  Classroom, assistant, and payment-settings surface.
- Create an executable enabled-route inventory.

Exit: no enabled action can claim success without an authoritative service.

### Gate 2 — Green engineering and dependency baseline

- Fix component test initialization.
- Classify and minimally upgrade the current axios/router/PostCSS/nanoid
  advisories without `npm audit fix` bulk mutation.
- Re-run lint, three type projects, component/release/verifier tests, build, and
  dependency policy.

Exit: all current local gates pass and no unaccepted release-blocking advisory
remains.

### Gate 3 — Authentication and contract convergence

- Resume Phase 477 OpenAPI/mock-boundary discussion only after explicit approval.
- Implement the exact Teacher lifecycle, session lifecycle, role parser, upload,
  memory, chat/attachment/idempotency, and Teacher-help contracts.
- Generate negative schema/path/enum/error tests from one contract authority.

Exit: non-intercepted auth and Student command lanes pass.

### Gate 4 — Retained all-role journeys

- Close Student, Practice, Parent/Billing, Teacher, Admin, and Notification
  journeys using the executable route inventory.
- Remove or keep disabled every unready route.

Exit: all retained routes are real-service functional with failure/retry/session
evidence.

### Gate 5 — Same-candidate release evidence

- Bind frontend source/lock/build digest to the backend/infra candidate.
- Run approved staging startup, all-role browser/API smoke, dependency failure,
  and controlled rollback evidence through the locked Phase 474 topology.

Exit: only a same-candidate evidence package can reconsider HOLD. Production
release authority remains separately deferred.

## 15. Minimum Evidence Needed To Change HOLD

1. reviewed Home V2 route authority and executable rollback/preview decision;
2. current Teacher public registration → verify → pending review → admin approve
   → protected Teacher journey;
3. fail-closed roles with no active `tutor` compatibility;
4. green component/static/release/build and dependency gates;
5. generated OpenAPI/Web adapter compatibility;
6. no enabled mock/static/fake-PII success surface;
7. non-intercepted Student, Parent, Teacher, and Admin/operator journeys;
8. authenticated notification/realtime or an explicit disabled state;
9. current security and requirement-level verification artifacts;
10. immutable same-candidate frontend/backend/infra staging evidence.

## 16. Primary Evidence Anchors

| Area | Source |
| --- | --- |
| v9 no-switch authority | `.planning/REQUIREMENTS.md:7-36`; `docs/home-v2/v9-acceptance-contract.md:5`; `docs/home-v2/v9-final-readiness-decision.md:24` |
| current unauthorized route | `src/app/router/AppRouter.tsx:114`; `src/app/router/routeConfig.ts:419`; `tests/e2e/home-v2.spec.ts:3,38` |
| v9 evidence structure | `.planning/phases/298-v9-scope-acceptance-contract/298-SUMMARY.md:1`; `298-VERIFICATION.md:1`; `.planning/milestones/v9-MILESTONE-AUDIT.md:1` |
| stale codebase authority | `AGENTS.md:42,208`; `.planning/codebase/STRUCTURE.md:3,77`; `.planning/codebase/INTEGRATIONS.md:7` |
| role failure | `src/store/authStore.ts:19-44`; `src/components/auth/RegisterForm.tsx:68` |
| registration failure | `src/components/auth/RegisterForm.tsx:141,178`; `src/services/auth/authApi.ts:51`; backend `src/stoa/models/user.py:14-50` |
| session gap | `src/services/api/httpClient.ts:43-65`; `src/components/layout/UserMenu.tsx:24`; backend `src/stoa/routers/auth.py:874,1012,1055` |
| upload/memory/chat/help | `src/services/files/fileApi.ts:4-19`; `src/services/learning/memoryApi.ts:42`; `src/services/chat/chatStreamApi.ts:4-33`; `src/services/teacherHelp/teacherHelpApi.ts:30` |
| synthetic core surfaces | `src/pages/assistant/StudentAssistantEntryPage.tsx:98,188`; `src/services/questionBank/questionBankApi.ts:1`; `src/features/live-classroom/services/liveClassroomService.ts:1`; `src/features/uploads/services/uploadService.ts:29` |
| fake PII | `src/services/student/studentApi.ts:7,139`; `src/pages/billing/PaymentSettingsPage.tsx:22` |
| tests/mock boundary | `vitest.config.ts:12`; `tests/setup.ts:5`; `tests/mswServer.ts:4`; `playwright.config.ts:25`; `src/mocks/handlers/index.ts:73,91,116` |
| realtime token query | `src/services/notifications/realtimeNotifications.ts:17` |
| runtime release foundation | `src/lib/runtimeConfig.ts:55`; `src/bootstrap.ts:54`; `src/lib/env.ts:18-27` |

---

**Final verdict:** preserve the strong frontend release/bootstrap foundation and
the useful local product components, but do not accept the current router,
enabled product surface, backend integration, planning evidence, security
evidence, or dependency state as a release candidate.
