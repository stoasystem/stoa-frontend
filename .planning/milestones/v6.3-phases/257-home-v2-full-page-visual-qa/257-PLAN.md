# Phase 257: Home V2 Full-Page Visual QA - Plan

## Goal

Audit `/home-v2` as a complete high-end Swiss-parent homepage before asset collection or implementation changes.

## Requirements Covered

- VQA-01
- VQA-02
- VQA-03
- VQA-04

## Tasks

1. Capture full-page screenshots for `/home-v2` at desktop, tablet/narrow, and mobile widths.
2. Capture English and German runtime screenshots by setting `stoa_language`.
3. Run a static copy-length/tone scan for EN/DE/FR/IT `homeV2.json`.
4. Inspect DOM measurements for major section bounds and potential narrow-screen image dominance or text overflow.
5. Write a severity-ranked visual QA report with issues to fix in v6.3 and issues to defer.

## Acceptance

- Screenshot evidence exists outside the repo under `/private/tmp/stoa-home-v2-v6-3/257/`.
- Findings are documented in `257-VISUAL-QA.md`.
- Verification notes are captured in `257-VERIFICATION.md`.
- ROADMAP/STATE can be updated after completion.
