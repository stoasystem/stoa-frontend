# Project Research Summary

**Project:** STOA Frontend
**Domain:** Staging deployment, QA, E2E testing, feedback, and early user testing for an education MVP
**Researched:** 2026-05-25
**Confidence:** HIGH

## Executive Summary

Phase 8 should prioritize operational readiness over new product breadth. STOA already has the student-parent-tutor MVP loop; the next milestone needs the scaffolding that lets real early users reach it, testers evaluate it consistently, and developers avoid shipping obvious regressions.

The recommended approach is a small, standard web-app readiness stack: GitHub Actions for CI, Vercel/Netlify-compatible SPA fallback config, Playwright smoke tests for the main role flows, concise manual QA docs, a thin feedback endpoint/UI, GitHub bug templates, and security/privacy checklists. This avoids premature production operations while providing enough rigor for staging trials.

The main risks are false confidence from shallow CI, deep-route 404s after static deployment, brittle E2E tests, feedback without triage, and MVP security shortcuts leaking into production assumptions. Each should map directly into roadmap phases and acceptance criteria.

## Key Findings

### Recommended Stack

Use GitHub Actions with Node 20 and npm lockfile-based install as the first CI gate. Use Playwright Test for browser smoke tests because its official `webServer` config fits local Vite apps and its CI docs cover GitHub Actions patterns. Use Vercel or Netlify SPA fallback config, with AWS deployment left as a future infrastructure choice if speed is less important than architecture parity.

**Core technologies:**
- GitHub Actions: CI install/lint/build gate.
- Vercel/Netlify static hosting config: staging and route fallback.
- Playwright Test: E2E smoke coverage.
- SQLite-backed local backend additions: feedback persistence and demo reset support.

### Expected Features

**Must have (table stakes):**
- Staging configuration and route fallback.
- GitHub Actions CI for `npm ci`, lint, and build.
- Manual QA checklist.
- Playwright smoke tests for auth, student chat, parent report, and tutor workflow.
- Feedback button/dialog/API path.
- Bug report template and severity workflow.
- Privacy/terms placeholders.
- Staging/deployment/testing/demo/feedback/security docs.

**Should have (competitive):**
- Role-specific QA and E2E paths that prove STOA's student-parent-tutor loop.
- Feedback enriched with route and user role.
- MVP demo docs for non-technical stakeholders.

**Defer (v2+):**
- Full production deployment.
- Full monitoring/alerting.
- Legal-final policy text.
- Data warehouse or advanced analytics.

### Architecture Approach

Keep Phase 8 as a thin readiness layer around the existing app. New repo-level config handles CI and static hosting. New `docs/` files encode process. New `tests/e2e/` files validate the browser flows. New feedback modules follow the existing service/hook/component pattern and post to a local backend `/feedback` endpoint. Public legal placeholder routes attach to the existing router.

**Major components:**
1. CI workflow — protects pushes and PRs from broken lint/build.
2. Deployment config — enables SPA refresh and staging env documentation.
3. E2E suite — validates the main role loop.
4. Feedback slice — captures early user reports.
5. Docs/security/legal artifacts — make testing and risk posture explicit.

### Critical Pitfalls

1. **Staging works only at `/`** — prevent with SPA fallback config and deep-route smoke tests.
2. **CI gives false confidence** — run `npm ci`, lint, and build on push and PR.
3. **E2E is too broad too early** — start with four smoke specs tied to the demo flow.
4. **Feedback is not actionable** — capture type, route, role, message, and define bug workflow.
5. **MVP security assumptions leak forward** — explicitly document localStorage, demo shortcuts, file upload, frontend secrets, and XSS risks.

## Implications for Roadmap

Suggested phase structure should continue from Phase 34.

### Phase 35: Staging Deployment Configuration
**Rationale:** Deep-link-safe staging is the foundation for real user access.
**Delivers:** SPA fallback config, staging env docs, preview process.
**Addresses:** staging deployment, API env, route refresh.
**Avoids:** Staging works only at `/`.

### Phase 36: CI and Preview Workflow
**Rationale:** CI should protect every later change before adding more test/docs surface.
**Delivers:** GitHub Actions workflow and preview instructions.
**Uses:** GitHub Actions, Node 20, npm ci.
**Avoids:** CI false confidence.

### Phase 37: Playwright E2E Smoke Suite
**Rationale:** Automated tests should cover the core student-parent-tutor loop before early users test it.
**Delivers:** Playwright config, scripts, four specs, testing docs.
**Uses:** Playwright `webServer`.
**Avoids:** Overbroad/flaky E2E by staying smoke-focused.

### Phase 38: Manual QA, Demo Reset, and Early User Testing Docs
**Rationale:** Human testers need repeatable instructions and reset expectations.
**Delivers:** QA checklist, demo flow, early user testing plan, reset docs.
**Addresses:** manual QA and early user testing requirements.

### Phase 39: Feedback Collection and Bug Workflow
**Rationale:** Early user testing is incomplete without a reporting and triage loop.
**Delivers:** Feedback UI/API/hook/backend table, docs, GitHub bug template.
**Avoids:** Unactionable feedback.

### Phase 40: Performance, Security, Privacy, and Readiness Plan
**Rationale:** Final staging readiness needs baseline performance, risk review, public notices, and production-readiness planning.
**Delivers:** Lighthouse/performance docs, frontend security review, privacy/terms placeholders, README Phase 8 update.
**Avoids:** MVP security assumptions leaking into production.

### Phase Ordering Rationale

- Deployment config comes before CI/E2E because route fallback and env assumptions shape tests and docs.
- CI comes before E2E so the repository has a minimal gate even if E2E is still being added.
- E2E comes before early-user docs so the documented demo flow can mirror tested paths.
- Feedback and bug workflow come before final readiness review because early testing must have a reporting loop.
- Security/privacy/performance close the milestone because they audit the final staging surface.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 35:** Hosted platform choice may need account-specific decisions.
- **Phase 37:** E2E may need deterministic backend setup details.
- **Phase 40:** Security/privacy docs need careful wording to avoid implying final legal compliance.

Phases with standard patterns:
- **Phase 36:** GitHub Actions npm CI is well documented.
- **Phase 39:** Feedback service follows existing app service/hook/mutation patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against official GitHub Actions, Vercel, Netlify, Playwright, and Lighthouse docs. |
| Features | HIGH | Directly derived from Phase 8 brief and common staging MVP requirements. |
| Architecture | HIGH | Fits existing Vite/React/FastAPI/SQLite project structure. |
| Pitfalls | HIGH | Official docs and OWASP guidance cover the main failure modes. |

**Overall confidence:** HIGH

### Gaps to Address

- **Actual hosted staging URL:** Requires deployment platform/account decision during execution.
- **Backend staging availability:** Docs can prepare `VITE_API_BASE_URL`; real staging backend depends on backend deployment.
- **E2E data determinism:** Tests may need local backend startup/reset or a mocked path if backend is unavailable.
- **Legal text:** Privacy/terms pages must remain placeholders until reviewed.

## Sources

### Primary (HIGH confidence)
- Vercel Vite docs: https://vercel.com/docs/frameworks/frontend/vite
- Vercel rewrites docs: https://vercel.com/docs/routing/rewrites
- Netlify redirects docs: https://docs.netlify.com/manage/routing/redirects/overview/
- GitHub setup-node docs: https://github.com/actions/setup-node
- Playwright web server docs: https://playwright.dev/docs/test-webserver
- Playwright CI docs: https://playwright.dev/docs/ci
- Lighthouse CI configuration docs: https://googlechrome.github.io/lighthouse-ci/docs/configuration.html
- GitHub issue template docs: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests
- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- OWASP Web Storage testing guide: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/12-Testing_Browser_Storage

---
*Research completed: 2026-05-25*
*Ready for roadmap: yes*
