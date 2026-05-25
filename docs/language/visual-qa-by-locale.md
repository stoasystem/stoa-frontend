# Phase 17 Visual QA by Locale

**Status:** Passed on 2026-05-25 after the tutor mobile overflow fix.
**Locales:** `en`, `de`, `fr`, `it`
**Required widths:** `375px`, `430px`, `768px`, `1024px`, `1440px`

## Required Pages

| Page | Route used | Auth role | Coverage |
|------|------------|-----------|----------|
| Homepage | `/` | Public | Automated |
| Login | `/login` | Public | Automated |
| Register | `/register` | Public | Automated |
| Chat | `/chat` | Student | Automated with demo backend |
| Parent dashboard | `/parent` | Parent | Automated with demo backend |
| Parent report | `/parent/children/user-student/report` | Parent | Automated with demo backend |
| Tutor workflow | `/tutor` | Tutor | Automated with demo backend |
| Pricing | `/pricing` | Public | Automated |
| Billing | `/billing` | Parent | Automated with demo backend |
| Support | `/support` | Public | Automated |

## Automated Evidence

Local setup:

```bash
npm run demo:backend
VITE_API_BASE_URL=/api npm run dev -- --host 127.0.0.1 --port 5174
```

Browser QA:

```text
Checked: 200 combinations
Matrix: 10 routes x 4 locales x 5 viewport widths
Failures: []
```

The browser check verified:

- no page-level horizontal overflow
- no visible headings, paragraphs, links, buttons, labels, or table cells outside the viewport
- no authenticated route stuck in the loading-account state
- controlled horizontal overflow inside the pricing comparison table remains contained in its scroll area

## Locale Findings

| Locale | Homepage hero | Navbar and CTA | Register | Chat teacher action | Pricing and billing | Parent report | Tutor workflow |
|--------|---------------|----------------|----------|---------------------|---------------------|---------------|----------------|
| English | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| German | Pass: stacked title keeps rhythm | Pass | Pass | Pass | Pass; comparison table uses contained horizontal scroll on mobile | Pass | Pass |
| French | Pass after Phase 101 homepage overflow fix | Pass | Pass | Pass | Pass; comparison table uses contained horizontal scroll on mobile | Pass | Pass |
| Italian | Pass | Pass | Pass | Pass | Pass; CTAs do not overflow | Pass | Pass |

## Issues Found and Fixed

| Issue | Found in | Fix | Final status |
|-------|----------|-----|--------------|
| French mobile homepage overflow in teacher-support section | Phase 101 browser smoke at `375px` | Added `min-w-0`, width, and wrapping safeguards in `HomeTeacherFallback` | Passed |
| Tutor dashboard page overflow at `375px` and `430px` | Phase 102 full matrix | Added `min-w-0` to dashboard main layout and tutor request cards, plus safer wrapping in tutor list text | Passed |
| Pricing comparison table cells extend beyond viewport | Phase 102 first matrix | Confirmed as contained table scroll, not page overflow; final detector treats controlled scroll areas separately | Passed |

## Manual Follow-Up

- Native speakers should still review German, French, and Italian tone before a broad launch.
- Legal-sensitive translation remains draft product copy and needs professional legal review before production use.
- Phase 18 should turn this Playwright-style overflow check into repeatable cross-locale visual regression automation.
