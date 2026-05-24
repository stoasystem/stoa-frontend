# Pitfalls Research

**Domain:** Staging, QA, E2E, feedback, and security readiness for an education MVP
**Researched:** 2026-05-25
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Staging Works Only at `/`

**What goes wrong:**
The static app loads at the root URL, but direct links or refreshes on React Router paths return 404.

**Why it happens:**
Static hosts need explicit SPA fallback because `/chat` and `/parent/...` are client-side routes, not files.

**How to avoid:**
Add Vercel rewrite and/or Netlify `_redirects`, then smoke-test deep routes.

**Warning signs:**
Manual test only checks `/`; hosted demo links fail after refresh.

**Phase to address:**
Staging deployment configuration.

---

### Pitfall 2: CI Gives False Confidence

**What goes wrong:**
CI passes but does not run the same install/build path developers and staging use.

**Why it happens:**
Workflows use `npm install`, omit lint/build, or only run on pushes after merge.

**How to avoid:**
Use `npm ci`, `npm run lint`, and `npm run build` on both push and pull request.

**Warning signs:**
CI is green but local `npm run build` fails; lockfile changes are not caught.

**Phase to address:**
CI workflow.

---

### Pitfall 3: E2E Tests Are Too Broad Too Early

**What goes wrong:**
The team adds many brittle browser tests, making CI slow and flaky before the staging flow stabilizes.

**Why it happens:**
E2E is treated as exhaustive coverage rather than a smoke suite for core value.

**How to avoid:**
Start with four focused specs: auth, student chat, parent dashboard/report, tutor workflow.

**Warning signs:**
Tests rely on implementation details, fragile text, or mutable order across previous test runs.

**Phase to address:**
E2E setup.

---

### Pitfall 4: Feedback Is Collected But Not Actionable

**What goes wrong:**
Users submit feedback that lacks route, role, reproduction steps, or severity context.

**Why it happens:**
The form captures only free text and there is no bug workflow.

**How to avoid:**
Capture feedback type, page, user role, and timestamp; pair it with GitHub issue template and severity definitions.

**Warning signs:**
Team cannot reproduce submitted issues without contacting the user again.

**Phase to address:**
Feedback and bug workflow.

---

### Pitfall 5: Security Review Pretends MVP Auth Is Production-Ready

**What goes wrong:**
The team ships staging assumptions into production, including localStorage token tradeoffs and demo shortcuts.

**Why it happens:**
MVP security shortcuts are not documented as temporary.

**How to avoid:**
Add security checklist and privacy notice placeholders; explicitly flag localStorage, file upload, demo shortcuts, and XSS concerns.

**Warning signs:**
Production env has demo shortcuts enabled; frontend contains secrets; chat rendering uses dangerous HTML.

**Phase to address:**
Security review and legal placeholders.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Manual preview only | No hosting setup needed | Not usable by real external users | Temporary while waiting for deployment credentials. |
| SQLite feedback table | Quick feedback persistence | No support dashboard | Acceptable for local/staging MVP if retrieval is documented. |
| Markdown issue template | Fast setup | Less structured than issue forms | Acceptable until triage volume increases. |
| Manual Lighthouse baseline | No extra CI complexity | Baselines can drift | Acceptable before performance budgets are stable. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vercel | Rewriting to `/` or omitting `index.html` route check | Use documented Vite SPA rewrite and test deep paths. |
| Netlify | Putting `_redirects` outside publish output | Put `_redirects` under `public/` so Vite copies it to `dist`. |
| Playwright | Starting tests without app server | Use `webServer` config or document external staging URL usage. |
| GitHub Actions | Cache without lockfile discipline | Use `setup-node@v4` with npm cache and `npm ci`. |
| Feedback endpoint | Accepting empty messages | Validate type/message on frontend and backend. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Bundle growth ignored | Build warning becomes normal and load gets slower | Record build output and Lighthouse baseline | As dependencies accumulate. |
| E2E starts dev server for every spec | Slow test runs | One Playwright webServer per test run | Once specs grow beyond smoke suite. |
| Streaming UI re-renders too often | Chat stutters under long responses | Keep streaming state localized and avoid global high-frequency writes | Long AI responses or mobile devices. |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Frontend secrets in `VITE_*` vars | Secrets ship to every browser | Keep model/API/database secrets backend-only. |
| Production demo shortcuts | Unauthorized demo account discovery | Gate with env and disable in production. |
| `dangerouslySetInnerHTML` for chat | XSS from user/AI content | Render text safely; sanitize if markdown is added later. |
| Token permanence in localStorage | XSS can expose token | Document MVP tradeoff and future httpOnly/refresh-token hardening. |
| Upload validation only in frontend | Malicious files bypass browser checks | Backend must also validate type, size, path, filename. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Feedback hidden in user menu only | Early users do not report issues | Make feedback visible in role layout when enabled. |
| QA docs too long | Testers skip them | Keep checklist grouped by role and route. |
| Privacy placeholders sound final | Users misunderstand legal status | Clearly label as testing-stage placeholder. |

## "Looks Done But Isn't" Checklist

- [ ] **Staging:** Root page works but deep route refresh is untested.
- [ ] **CI:** Workflow exists but does not run on pull requests.
- [ ] **E2E:** Tests exist but require manual backend setup not documented.
- [ ] **Feedback:** Dialog submits but no backend persistence or retrieval path exists.
- [ ] **Security:** Checklist exists but production demo flags are not covered.
- [ ] **Privacy:** Routes exist but are not linked or accessible publicly.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Deep route 404 | LOW | Add SPA fallback and redeploy. |
| Flaky E2E | MEDIUM | Reduce to smoke paths, reset demo data, add retries only in CI if necessary. |
| Feedback not actionable | MEDIUM | Add route/role fields and bug template; backfill process from user interviews. |
| Security shortcut leaks to production | HIGH | Disable env flags, rotate tokens if exposed, document mitigation before launch. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Staging deep route 404 | Staging deployment configuration | Curl/preview `/chat`, `/parent`, `/tutor/requests/:id`. |
| Weak CI | CI workflow | GitHub workflow includes `npm ci`, lint, build on push and PR. |
| Overbroad E2E | E2E setup | Four stable smoke specs run locally. |
| Unactionable feedback | Feedback workflow | Feedback payload includes type/page/role/message and docs define triage. |
| MVP security assumptions | Security/legal phase | Security review checklist covers secrets, storage, upload, XSS, demo flags. |

## Sources

- Vercel Vite docs: https://vercel.com/docs/frameworks/frontend/vite
- Netlify redirects docs: https://docs.netlify.com/manage/routing/redirects/overview/
- GitHub setup-node docs: https://github.com/actions/setup-node
- Playwright web server docs: https://playwright.dev/docs/test-webserver
- Playwright CI docs: https://playwright.dev/docs/ci
- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- OWASP Web Storage testing guide: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/12-Testing_Browser_Storage

---
*Pitfalls research for: STOA Phase 8 staging and early testing*
*Researched: 2026-05-25*
