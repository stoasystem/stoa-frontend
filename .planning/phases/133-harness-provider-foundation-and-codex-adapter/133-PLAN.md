# Phase 133 Plan: Harness Provider Foundation and Codex Adapter

## Goal

Create a local demo provider foundation with Codex and template providers while keeping provider details internal.

## Tasks

- [x] Create provider interface dataclasses and protocol.
- [x] Create Codex CLI provider adapter.
- [x] Create template fallback provider.
- [x] Create provider router and health metadata.
- [x] Add local provider logging with gitignored log directory.

## Verification

- Python import checks for provider modules.
- Router fallback can instantiate without Codex availability.

