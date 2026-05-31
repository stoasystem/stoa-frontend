# Phase 175 Plan: Cross-Locale UI Fit and Missing-Key QA

## Goal

Verify that four-language copy fits the STOA UI and does not leak raw translation keys.

## Tasks

- Run locale key parity across `en`, `de`, `fr`, and `it`.
- Run French apostrophe scan.
- Run browser smoke across representative routes, locales, and viewports.
- Check for horizontal overflow, `undefined`, `[object Object]`, and raw i18n key leakage.

## Verification

- Key parity passes.
- Browser smoke passes for required representative surfaces.
