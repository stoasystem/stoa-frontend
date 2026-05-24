# Feature Research

**Domain:** Staging, QA, E2E, feedback, and early user testing for an education MVP
**Researched:** 2026-05-25
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Staging URL and environment docs | Team and early users need a stable link that is not local-only. | MEDIUM | Actual hosting may require platform credentials; repo can prepare Vercel/Netlify config and docs. |
| SPA route fallback | React Router routes must survive refresh and shared direct links. | LOW | Add Vercel and/or Netlify fallback config. |
| CI build and lint gate | Developers need immediate signal before merging or pushing broken builds. | LOW | GitHub Actions with `npm ci`, `npm run lint`, `npm run build`. |
| Manual QA checklist | Early testing needs repeatable human coverage before automated E2E is complete. | LOW | Store in `docs/qa/manual-qa-checklist.md`. |
| E2E smoke tests | Core flows should be reproducible and guard regressions. | MEDIUM | Start with four Playwright specs rather than broad exhaustive tests. |
| Feedback collection | Early users need an obvious way to report bugs/confusion. | MEDIUM | Simple feedback dialog + `/feedback` endpoint is enough. |
| Bug report template | Team needs consistent repro details. | LOW | Markdown template is sufficient for MVP. |
| Privacy/terms placeholders | Student/parent data makes a basic test-stage notice necessary. | LOW | Clearly mark placeholders as non-final legal text. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Role-specific QA and E2E flows | STOA's value is the student-parent-tutor loop; testing should reflect that loop. | MEDIUM | Auth, chat, parent report, tutor status/note paths matter more than generic page tests. |
| Feedback enriched with role and page | Makes early user reports easier to triage. | LOW | Capture route and current user role automatically. |
| MVP demo flow docs | Helps non-technical stakeholders consistently evaluate product value. | LOW | Keep it short and operational. |
| Security review checklist tailored to localStorage/upload/chat | Avoids obvious early-user risk without pretending full compliance is done. | LOW | Document current risks and deferred production hardening. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full production deployment | Feels like the next logical step after staging. | Pulls in domain, monitoring, compliance, support, and operational scope. | Production readiness plan only. |
| Full monitoring platform | Useful for production operations. | Overkill before early-user staging traffic. | Performance/security checklists plus analytics/feedback endpoints. |
| Broad E2E suite for every route | Appears rigorous. | Slow, brittle, and expensive before flows stabilize. | Four core smoke specs focused on user value. |
| Legal-complete policy pages | Important later. | Requires legal review and can block engineering readiness. | Clear privacy/terms placeholders for testing stage. |

## Feature Dependencies

```text
Staging env vars
  -> staging deployment docs
  -> staging URL testing

SPA fallback
  -> direct route refresh QA

CI workflow
  -> reliable PR/push checks
  -> E2E can be added after Playwright setup

Feedback endpoint
  -> feedback dialog
  -> feedback workflow docs

Manual QA checklist
  -> early user testing plan
  -> bug tracking workflow
```

### Dependency Notes

- **E2E requires stable selectors and deterministic demo data:** Tests should use visible text/roles where possible and seed assumptions from Phase 7.
- **Feedback UI requires environment gating:** `VITE_ENABLE_FEEDBACK` should allow feedback in staging while keeping production rollout controlled.
- **Privacy placeholders depend on routes:** `/privacy` and `/terms` must be public routes so early users can read them before login.

## MVP Definition

### Launch With (v1.7)

- [ ] Staging config and SPA fallback.
- [ ] GitHub Actions CI for install/lint/build.
- [ ] Playwright setup and four smoke specs.
- [ ] Manual QA, staging, E2E, demo, feedback, security, and performance docs.
- [ ] Feedback button/dialog/service/hook and local backend endpoint.
- [ ] Bug report template.
- [ ] Privacy and terms placeholders.

### Add After Validation (v1.x)

- [ ] Automated deployment integration with selected provider.
- [ ] CI E2E against preview URL.
- [ ] Lighthouse CI budget enforcement.
- [ ] Issue form YAML with required fields.

### Future Consideration (v2+)

- [ ] Production observability and alerting.
- [ ] Full legal policy pages and consent workflow.
- [ ] Support inbox/CRM integration.
- [ ] Data warehouse and advanced analytics.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| CI build/lint | HIGH | LOW | P1 |
| SPA fallback | HIGH | LOW | P1 |
| Manual QA checklist | HIGH | LOW | P1 |
| Playwright smoke tests | HIGH | MEDIUM | P1 |
| Feedback collection | HIGH | MEDIUM | P1 |
| Privacy/terms placeholders | MEDIUM | LOW | P1 |
| Performance baseline | MEDIUM | LOW | P2 |
| Hosted preview automation | MEDIUM | MEDIUM | P2 |
| Full monitoring platform | MEDIUM | HIGH | P3 |

## Competitor Feature Analysis

| Feature | Common SaaS MVP Pattern | Education-Specific Need | STOA Approach |
|---------|--------------------------|-------------------------|---------------|
| Staging | Preview or staging link per branch/main | Test accounts must include student, parent, tutor | Use staging env flags and documented demo accounts. |
| Feedback | Widget or form | Role and route context matter | Capture feedback type, route, message, and user role. |
| QA | Manual smoke checklist + E2E | Student/parent/tutor loop must be tested end-to-end | Manual checklist and Playwright specs map to the core loop. |
| Privacy notice | Placeholder then legal review | Student learning data is sensitive | Public placeholders with explicit test-stage warning. |

## Sources

- Vercel Vite docs: https://vercel.com/docs/frameworks/frontend/vite
- GitHub Actions setup-node docs: https://github.com/actions/setup-node
- Playwright running tests docs: https://playwright.dev/docs/running-tests
- Playwright CI docs: https://playwright.dev/docs/ci
- GitHub issue template docs: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests
- OWASP Web Storage testing guide: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/12-Testing_Browser_Storage

---
*Feature research for: STOA Phase 8 staging and early testing*
*Researched: 2026-05-25*
