# Practice Module Scope

## Positioning

Practice Path is a STOA student practice module for short, subject-based learning sessions. It complements Chat:

- Chat is for specific questions.
- Practice Path is for proactive review and consolidation.

The module should help students continue learning even when they do not have a specific question ready.

## Phase 27 Scope

Phase 27 delivers frontend design, page integration, component adaptation, interaction flow, API contracts, mock data, and demo support.

The priority is a polished, testable UI demo:

- Student can open Practice.
- Student can choose Mathematics or Physics.
- Student can complete a short lesson flow.
- Student sees feedback, hint, retry, and completion states.
- Student can request a Learning Assistant explanation or teacher support from a mistake context.
- Dashboard and parent report can show practice summaries.

## Out of Scope

- Production course database.
- Complex curriculum authoring.
- Adaptive learning algorithm.
- Payment-gated practice access.
- Formal teacher marketplace changes.
- Real-time teacher chat redesign.
- Direct frontend model/provider calls.
- Copying the reference project's backend, data model, or visual identity.

## Demo Data Boundary

Mock data should be realistic enough for demonstration and UI testing, but it must not imply a complete curriculum library.

Mathematics and Physics demo lessons can be deterministic and small. Correctness rules may be simple string or ordered-list checks during Phase 27.

## Future Handoff

The API contracts should make future backend integration straightforward. Page components should depend on service/hooks, not on the raw mock file.
