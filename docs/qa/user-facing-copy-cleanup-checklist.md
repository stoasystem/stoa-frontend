# Phase 32 User-Facing Copy Cleanup Checklist

## Language Quality

- [x] English copy reviewed for calm, education-centered tone.
- [x] German copy reviewed for concise, natural phrasing and short labels.
- [x] French copy reviewed for natural phrasing and typographic apostrophes.
- [x] Italian copy reviewed for warm, compact CTAs and form/state wording.
- [x] Meaning is consistent across four languages without requiring literal translation.
- [x] Core terms remain aligned: Learning Assistant, Learning Chat, Professional teacher support, Practice Path, Parent Report.

## Artifact Cleanup

- [x] Visible Practice `demo path` wording removed.
- [x] Visible lesson-result `student demo flow` wording removed.
- [x] Visible TODO page text removed from legacy page stubs.
- [x] Visible billing mock-key references renamed to plan-selection review wording.
- [x] Visible admin analytics `Mock checkout completed` label removed.
- [x] Visible homepage `prompt` wording replaced with `hint`.
- [x] Hidden debug/demo infrastructure documented as feature-flagged internal support.

## State Copy

- [x] Chat load/create/upload failures rewritten into friendly retry copy.
- [x] Teacher request failure copy rewritten into friendly retry copy.
- [x] Billing plan selection copy avoids mock/demo wording.
- [x] Empty and unavailable states remain user-facing and non-technical.

## UI Fit

- [x] German title strategy remains short and stacked where needed.
- [x] French apostrophes use typographic `’` in locale files.
- [x] Italian CTA labels remain compact enough for mobile review.
- [x] Navbar/footer/contact/register/Practice/Chat/Parent/Tutor/Billing/Pricing surfaces are included in smoke scope.

## Verification

- [x] Locale key parity checked across `en`, `de`, `fr`, and `it`.
- [x] Forbidden/high-risk term scan completed and classified.
- [x] `npm run build` passes after final edits.
- [x] Four-language smoke / visual QA evidence recorded.
