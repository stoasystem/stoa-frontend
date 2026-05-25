# Project Research - Pitfalls for v1.8 Phase 9

## Pitfalls

### Treating Vite Env Vars as Secrets

`VITE_` values are exposed to browser code. Production API URLs and feature flags are fine; API keys, database credentials, tokens, and private DSNs are not.

### Uploading Sensitive Learning Content to Telemetry

Error and analytics payloads must not include full chat content, passwords, tokens, file contents, or sensitive student data. Prefer IDs, roles, route, status, duration, and coarse subject metadata.

### Assuming SQLite Is Production

SQLite remains useful for local and demo flows, but Phase 9 must document that production data protection belongs to the backend database plan. If pilot temporarily uses SQLite-like storage, backup/restore must be explicit and rehearsed.

### Building Too Much Admin

Pilot admin operations should show usage, feedback, help-request visibility, environment/version status, and placeholders. Full user management and BI dashboards should remain deferred.

### Blocking User Flows on Telemetry

Analytics, support telemetry, and monitoring should degrade gracefully. A failed analytics request must not prevent chat, report viewing, tutor workflow, or support UI from continuing.

### Legal Placeholder Drift

Privacy and terms pages can remain pilot drafts, but they must state pilot nature, AI limitations, parent visibility, data categories, and contact path clearly enough for real pilot users.

## Prevention Strategy

- Keep telemetry services thin and privacy-filtered.
- Add explicit docs for allowed/disallowed event payload fields.
- Gate demo shortcuts and telemetry with environment flags.
- Verify `/privacy`, `/terms`, `/support`, `/pricing`, `/billing`, and `/admin` routes before launch.
- Use launch checklist as the final go/no-go artifact.
