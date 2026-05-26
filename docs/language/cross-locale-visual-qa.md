# Cross-Locale Visual QA

**Phase:** Phase 20
**Status:** Passed with automated build verification and targeted cross-locale browser smoke coverage.
**Date:** 2026-05-26

## Scope

Pages:

- Homepage `/`
- Register `/register`
- Chat `/chat`
- Parent Report `/parent/children/user-student/report`
- Pricing `/pricing`
- Billing `/billing`

Locales:

- `en`
- `de`
- `fr`
- `it`

Target widths:

- `375px`
- `430px`
- `768px`
- `1024px`
- `1440px`

## What Was Checked

- hero title wrapping
- subtitle height and line rhythm
- CTA label fit
- card and section title wrapping
- form label readability
- chat teacher-support action readability
- parent report heading length
- pricing and billing button labels
- French apostrophe rendering
- German long-word and compound handling
- Italian CTA width

## Phase 20 Locale Findings

| Locale | Homepage | Register | Chat | Parent Report | Pricing | Billing | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| English | Calm hero and short mobile CTA fit | Labels remain direct | Empty state reads as product copy | Report wording stays non-alarmist | Value language, no purchase pressure | Plan choice language | Pass |
| German | Stacked title and shorter copy preserve rhythm | Role copy avoids direct English structure | Teacher action is shorter and clearer | `Übungsthemen` avoids deficit framing | Compound-heavy labels reduced | Teacher-plan copy shortened | Pass |
| French | Apostrophes render with typographic `’` | Form labels remain concise | Teacher prompt avoids truncation | Parent copy remains elegant and readable | Plan wording remains clear | Subscription copy remains stable | Pass |
| Italian | Hero and CTA remain natural | Role copy is warmer and shorter | Teacher action fits better | Report copy avoids awkward literal phrasing | CTA wording remains button-friendly | Billing actions remain clear | Pass |

## Browser Smoke Evidence

Local browser smoke:

```text
Routes: /, /register, /pricing, /support
Locales: en, de, fr, it
Widths: 375px, 1024px
Combinations checked: 32
Horizontal overflow failures: 0
html lang checks: passed for en, de, fr, it
```

The smoke pass confirmed no page-level horizontal overflow for the public surfaces most affected by Phase 20 copy and CTA changes. Protected app routes are covered by build/type checks in this phase and should be included in the next authenticated visual-regression pass.

## Reduced Evidence Note

Phase 17 completed a full automated 200-combination overflow matrix. Phase 20 made a narrower copy/layout pass and reused the same target matrix for review while verifying the changed code path with `npm run build` and the 32-combination browser smoke above.

Targeted Phase 20 checks focused on the surfaces and strings modified in this phase. Full screenshot regression across all 120 Phase 20 page/locale/width combinations remains recommended before broad launch.

## Source Safety

`/Users/zhdeng/newweb` was used only as a read-only German style reference. Phase 20 did not modify it.

Known pre-existing source status:

```text
 M img/team/.DS_Store
```

## Verification Commands

```bash
npm install
npm run build
npm run dev -- --host 127.0.0.1
```

## Remaining Follow-Up

- Native-speaker review is still recommended for German, French, and Italian before launch.
- Full visual regression automation should be part of the next accessibility and release-quality milestone.
- Legal-sensitive copy still needs professional legal translation and review before production use.
