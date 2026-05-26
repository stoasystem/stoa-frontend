# Phase 112 - UI Review

**Audited:** 2026-05-26
**Baseline:** Phase 109 UI-SPEC.md plus Phase 108-112 artifacts and design docs
**Screenshots:** initial auditor could not capture screenshots; remediation pass captured `/private/tmp/stoa-phase19-home-final.png`, `/private/tmp/stoa-phase19-register-final.png`, `/private/tmp/stoa-phase19-pricing-final.png`, and `/private/tmp/stoa-phase19-chat-final.png`.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | Phase 19 safety copy is mostly preserved, but several contract strings do not match the approved chat, generic empty, error, and billing states. |
| 2. Visuals | 3/4 | Shared primitives and core app pages read warmer and more editorial, but legacy landing visual blocks still use off-contract color, radius, and shadow choices. |
| 3. Color | 2/4 | Token mapping is strong, but 16 hardcoded color/shadow values remain, including blue/green/gold values outside the burgundy/charcoal/warm-neutral contract. |
| 4. Typography | 2/4 | The implementation uses 9 text sizes and both 500/600 weights, violating the UI-SPEC rule for new/changed styling to use regular 400 and semibold 600. |
| 5. Spacing | 3/4 | Spacing mostly follows 4px increments, but arbitrary layout values and 20-24px radii remain on public imagery/card shells. |
| 6. Experience Design | 3/4 | Loading/error/disabled/chat states and registry safety are generally covered, but Phase 112 did not complete authenticated app route screenshots or full EN/DE/FR/IT visual evidence. |

**Overall: 15/24**

---

## Remediation Pass

**Completed:** 2026-05-26

The initial review findings above are preserved as the source audit. The Phase 19 implementation was then updated to close the highest-risk issues before handoff:

- Replaced off-contract public-surface hex/HSL values with Phase 109 derived STOA tokens in homepage CTA, parent visibility, parent landing hero, teacher support explainer, and premium button compatibility styling.
- Removed remaining `tracking-tight`, arbitrary tracking, and non-zero `brand-section-kicker` letter spacing from changed/shared surfaces.
- Reduced the shared kicker weight to semibold and kept changed visual emphasis on the 400/600 weight contract.
- Updated chat empty state rendering to separate title/body copy across English, German, French, and Italian.
- Updated billing unavailable copy to the UI-SPEC wording.
- Captured fresh Playwright screenshots after remediation and reran `npm run build`, `npm run lint`, and `git diff --check`.

Follow-up scans found no remaining matches for the reviewed legacy color literals, tight/arbitrary tracking, or `font-bold`/`font-extrabold` in the Phase 19 source surfaces.

---

## Top 3 Priority Fixes

1. **Replace legacy hardcoded public-surface colors** - Prevents the platform from slipping back into blue/green/gold SaaS styling - Move `#152238`, `#7e8f7c`, `#b08a4a`, `#c2a15a`, `#efeae2`, and ad hoc blue HSL shadows/gradients into Phase 109 STOA tokens or remove them.
2. **Normalize typography to the contract** - Current 500-weight text, `tracking-tight`, and broad display scale weaken consistency and multilingual stability - Use only 400/600 for changed styling, remove negative tracking utilities, and limit large editorial sizes to approved public/auth/report heroes.
3. **Align required empty/error/billing copy** - Users get inconsistent recovery language and the audit cannot verify approved copy strings - Update chat empty, generic empty, generic error, and billing unavailable states to the UI-SPEC text or explicitly amend the contract.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**WARNING:** Chat empty state copy does not match the UI-SPEC contract. The contract specifies `Start your first learning conversation` plus `Ask a question, describe where you are stuck, or upload a worksheet to begin.`, but `src/i18n/locales/en/chat.json` uses `Ask your first homework question.` and a different assistant-focused body. `src/components/chat/ChatMessageList.tsx` also concatenates title and body into one `EmptyState` message instead of preserving heading/body hierarchy.

**WARNING:** Generic empty and error state components are too low-information for the contract. `src/components/common/EmptyState.tsx:1` accepts one plain message, and `src/components/common/ErrorState.tsx:1` accepts one plain message, so pages cannot consistently render the specified heading/body or recovery copy. Several pages still use terse fallback errors such as `Failed to load history.` in `src/pages/learning-history/StudentLearningHistoryPage.tsx:18` and `Failed to load profile.` in `src/pages/profile/StudentProfilePage.tsx:37`.

**WARNING:** Billing unavailable copy is close but not exact. `src/pages/billing/BillingPage.tsx:102` says `Usage details are not available yet...`, while the UI-SPEC requires `Billing details are not available yet. Learning activity will appear here once the account is active.`

**PASS WITH RISK:** Production-facing demo/mock language is mostly guarded. `src/components/auth/LoginForm.tsx:45` gates local account shortcuts behind `showDemoAccounts`, and `src/lib/env.ts:29` suppresses that in production-facing environments. However, `src/pages/billing/BillingPage.tsx:79` still references `mockCheckoutEnabled` keys internally; current locale values are product-safe, but this remains an easy regression point.

### Pillar 2: Visuals (3/4)

**WARNING:** The core shared primitives are visually aligned but not flawless. `src/components/ui/button.tsx:11` uses burgundy primary actions with charcoal hover, `src/components/ui/card.tsx:8` uses warm card styling, and `src/components/ui/input.tsx:9` / `src/components/ui/textarea.tsx:10` keep visible warm focus states. This satisfies the main component direction.

**WARNING:** Public landing visuals still carry non-contract treatment. `src/components/landing/ParentHero.tsx:37`, `src/components/landing/TeacherSupportExplainer.tsx:10`, and `src/components/home/HomeCTASection.tsx:22` use dark blue `#152238` panels rather than the specified charcoal token. `src/components/home/HomeParentVisibility.tsx:15` uses a standalone warm fill and 20px radius. These pages look polished, but the visual language is not fully derived from the approved Phase 109 system.

**WARNING:** Image cards exceed the shape contract. The UI-SPEC caps image containers at 12px unless an existing hero composition requires more, but `src/components/home/HomeMagazineImage.tsx:8` uses `rounded-[1.5rem]` and several public blocks use `rounded-[1.25rem]` or `rounded-xl`.

**PASS:** App surfaces remain operational rather than marketing-heavy. `src/pages/chat/ChatPage.tsx:210` keeps a viewport-fit chat workspace, `src/pages/dashboard/StudentDashboardPage.tsx:29` uses dense grids, and `src/pages/parent/ChildReportPage.tsx:69` applies the stronger report surface only to the parent report.

### Pillar 3: Color (2/4)

**WARNING:** Token setup is good, but implementation has off-contract color escapes. `src/styles/brand-tokens.css:1` maps the warm page/card/burgundy/charcoal system, and `src/index.css:1` imports it after compatibility themes as planned.

**WARNING:** Hardcoded color scan found 16 matches. Representative violations: `src/components/landing/ParentHero.tsx:37` and `src/components/landing/TeacherSupportExplainer.tsx:10` use `#152238`; `src/components/home/HomeParentVisibility.tsx:17` and `src/components/landing/ParentHero.tsx:45` use `#7e8f7c`; `src/components/home/HomeCTASection.tsx:25` uses `#c2a15a`; `src/components/landing/TeacherSupportExplainer.tsx:16` uses a hardcoded blue HSL gradient.

**WARNING:** Accent usage is broad but generally purposeful. Scan counts: `primary` color utilities appear 43 times, `accent` utilities appear 1 time, and most primary usage is for CTAs, nav, report/pricing emphasis, and selected states. The problem is less accent overuse and more bypassing the approved tokens with raw hex/HSL values.

### Pillar 4: Typography (2/4)

**WARNING:** The typography contract is not met. The scan found 9 text-size utilities: `text-sm` 241, `text-xs` 59, `text-xl` 41, `text-base` 35, `text-2xl` 20, `text-4xl` 18, `text-lg` 14, `text-3xl` 5, and `text-5xl` 3. Large public/auth/report sizes are allowed, but changed app components also use `text-xl`, `text-2xl`, and `text-3xl` for operational stats and cards.

**WARNING:** New/changed styling uses `font-medium` 98 times and `font-semibold` 63 times. The UI-SPEC explicitly limits new/changed styling to regular 400 and semibold 600. Examples include `src/components/dashboard/DashboardStatCard.tsx:8`, `src/components/parent/ParentReportSummaryCard.tsx:21`, and `src/layouts/AppLayout.tsx:77`.

**WARNING:** Negative/tight letter spacing remains. The design instruction forbids negative letter spacing, but `tracking-tight` appears in shared and changed surfaces such as `src/components/common/PageHeader.tsx:37`, `src/components/ui/card.tsx:24`, `src/layouts/AppLayout.tsx:105`, and `src/components/chat/ChatHeader.tsx:17`.

### Pillar 5: Spacing (3/4)

**PASS WITH RISK:** Most spacing classes stay on the Tailwind 4px scale. Frequent values are `gap-3` 69, `space-y-2` 68, `gap-4` 61, `space-y-3` 50, `p-4` 40, and `p-3` 38.

**WARNING:** Arbitrary spacing/layout scan found 33 matches. Many are defensible fixed app/table dimensions, but some are design-token drift: `src/components/home/HomeHero.tsx:42` uses `lg:pb-18 lg:pt-18`, `src/components/home/HomeMagazineImage.tsx:8` uses `min-h-[32rem]`, and multiple grid tracks use arbitrary rem values.

**WARNING:** Shape spacing is inconsistent with the contract. `src/components/home/HomeParentVisibility.tsx:15`, `src/components/home/HomeCTASection.tsx:22`, and `src/components/home/HomeMagazineImage.tsx:8` exceed the 8px app-card and 12px image-container guidance.

### Pillar 6: Experience Design (3/4)

**PASS:** Core interaction states are present. Loading states include `src/components/common/PageSkeleton.tsx:9`, `src/components/dashboard/DashboardSkeleton.tsx:6`, and `src/pages/chat/ChatPage.tsx:160`. Error states include `src/components/common/AppErrorBoundary.tsx:8`, `src/pages/chat/ChatPage.tsx:164`, and route-level query errors. Chat upload, retry, stop generation, disabled send, and teacher-help pending states are represented in `src/components/chat/ChatInput.tsx:87`, `src/components/chat/FileUploadButton.tsx:86`, `src/components/chat/StopGeneratingButton.tsx:6`, and `src/components/chat/ChatMessageBubble.tsx:97`.

**WARNING:** Icon-only buttons generally have `aria-label`s, but tooltip affordances are absent. Examples with labels include `src/components/chat/FileUploadButton.tsx:86`, `src/components/chat/StopGeneratingButton.tsx:6`, and `src/components/chat/ChatInput.tsx:117`; the design guidance expects tooltips for unfamiliar icon-only controls.

**WARNING:** Phase 112 QA evidence is incomplete for the UI-SPEC route matrix. `docs/design/visual-compatibility-qa.md` records screenshots for homepage, register mobile, pricing, and protected chat auth fallback, but it explicitly notes that authenticated app route screenshots should be repeated in Phase 20. The current audit could not capture fresh screenshots because no dev server was running.

**PASS:** Registry safety is clean for the current setup. `components.json` is absent, Phase 109 UI-SPEC marks `shadcn_initialized: false`, and the contract approves no third-party registries or blocks. No `shadcn view` registry audit was required.

---

## Files Audited

- `.planning/phases/108-main-website-read-only-audit-and-design-translation/108-CONTEXT.md`
- `.planning/phases/108-main-website-read-only-audit-and-design-translation/108-PLAN.md`
- `.planning/phases/108-main-website-read-only-audit-and-design-translation/108-SUMMARY.md`
- `.planning/phases/108-main-website-read-only-audit-and-design-translation/108-VERIFICATION.md`
- `.planning/phases/109-learning-platform-brand-tokens-and-theme-layer/109-CONTEXT.md`
- `.planning/phases/109-learning-platform-brand-tokens-and-theme-layer/109-PLAN.md`
- `.planning/phases/109-learning-platform-brand-tokens-and-theme-layer/109-SUMMARY.md`
- `.planning/phases/109-learning-platform-brand-tokens-and-theme-layer/109-UI-SPEC.md`
- `.planning/phases/109-learning-platform-brand-tokens-and-theme-layer/109-VERIFICATION.md`
- `.planning/phases/110-shared-component-visual-refinement/110-CONTEXT.md`
- `.planning/phases/110-shared-component-visual-refinement/110-PLAN.md`
- `.planning/phases/110-shared-component-visual-refinement/110-SUMMARY.md`
- `.planning/phases/110-shared-component-visual-refinement/110-VERIFICATION.md`
- `.planning/phases/111-public-and-auth-surface-alignment/111-CONTEXT.md`
- `.planning/phases/111-public-and-auth-surface-alignment/111-PLAN.md`
- `.planning/phases/111-public-and-auth-surface-alignment/111-SUMMARY.md`
- `.planning/phases/111-public-and-auth-surface-alignment/111-VERIFICATION.md`
- `.planning/phases/112-app-page-alignment-visual-qa-readme-and-handoff/112-CONTEXT.md`
- `.planning/phases/112-app-page-alignment-visual-qa-readme-and-handoff/112-PLAN.md`
- `.planning/phases/112-app-page-alignment-visual-qa-readme-and-handoff/112-SUMMARY.md`
- `.planning/phases/112-app-page-alignment-visual-qa-readme-and-handoff/112-VERIFICATION.md`
- `docs/design/main-website-design-translation.md`
- `docs/design/learning-platform-token-adjustment.md`
- `docs/design/visual-compatibility-qa.md`
- `src/styles/brand-tokens.css`
- `src/styles/platform-theme.css`
- `src/index.css`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/layouts/AppLayout.tsx`
- `src/layouts/MarketingLayout.tsx`
- `src/pages/login/LoginPage.tsx`
- `src/pages/auth/RegisterPage.tsx`
- `src/pages/chat/ChatPage.tsx`
- `src/pages/dashboard/StudentDashboardPage.tsx`
- `src/pages/parent/ChildReportPage.tsx`
- `src/pages/pricing/PricingPage.tsx`
- `src/pages/billing/BillingPage.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterRoleStep.tsx`
- `src/components/billing/PlanCard.tsx`
- `src/components/chat/ChatInput.tsx`
- `src/components/chat/ChatMessageBubble.tsx`
- `src/components/chat/ConversationSidebar.tsx`
- `src/components/chat/FileUploadButton.tsx`
- `src/components/chat/StopGeneratingButton.tsx`
- `src/components/chat/RetryMessageButton.tsx`
- `src/components/common/PageHeader.tsx`
- `src/components/common/SectionHeader.tsx`
- `src/components/common/EmptyState.tsx`
- `src/components/common/ErrorState.tsx`
- `src/components/common/AppErrorBoundary.tsx`
- `src/components/common/PageSkeleton.tsx`
- `src/components/dashboard/DashboardStatCard.tsx`
- `src/components/dashboard/NextActionCard.tsx`
- `src/components/home/HomeHero.tsx`
- `src/components/home/HomeLearningFlow.tsx`
- `src/components/home/HomeParentVisibility.tsx`
- `src/components/home/HomeCTASection.tsx`
- `src/components/landing/ParentHero.tsx`
- `src/components/landing/TeacherSupportExplainer.tsx`
- `src/components/parent/ParentReportSummaryCard.tsx`
- `src/components/parent/ParentReportStats.tsx`
- `src/i18n/locales/en/chat.json`
- `src/i18n/locales/en/billing.json`
- `src/lib/env.ts`

## Source Safety

`/Users/zhdeng/newweb` was not modified by this audit. Read-only status check showed the same pre-existing external change:

```text
 M img/team/.DS_Store
```
