---
status: complete
created: 2026-07-04
completed: 2026-07-04
---

# Phase 245 Plan

## Goal

Create the Home V2 page/component namespace and provisional multilingual skeleton copy.

## Tasks

- Add section-level Home V2 components.
- Compose sections from `HomeV2Page`.
- Add `homeV2` namespace to i18n configuration.
- Add EN/DE/FR/IT provisional `homeV2.json` files.
- Verify lint and build.

## Acceptance

- `SKEL-01`: `HomeV2Page` exists.
- `SKEL-02`: `src/components/home-v2/` contains Home V2 section components.
- `SKEL-03`: all five locked sections render.
- `I18N-01`: `homeV2` namespace is registered.
- `I18N-02`: EN/DE/FR/IT provisional locale files exist.
- `I18N-03`: visible skeleton copy reads from i18n resources.
