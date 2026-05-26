# Phase 32 Development Artifact Audit

| Search term | Files found | User-facing? | Action taken | Approved |
|-------------|-------------|--------------|--------------|----------|
| `demo` / `Demo` | Services, mock data, route metadata, hidden debug panel, old Practice copy | Mixed | Removed visible Practice `demo path` and `student demo flow`; kept internal demo fallback/service names and feature-flagged debug language. | Yes |
| `mock` / `Mock` | Mock data/services, analytics event, billing i18n keys | Mixed | Renamed visible/admin analytics label and billing i18n keys; kept internal mock data/service identifiers. | Yes |
| `test account` | No normal UI copy found | No | No action needed. Review-account shortcuts are hidden by environment flags. | Yes |
| `Codex` | Developer docs/backend harness only | No | No user-facing UI action needed. | Yes |
| `placeholder` | Input placeholder props and locale object key names | No visible placeholder-content issue | No action needed for HTML placeholder attributes; no Lorem/TODO placeholder content remains in reviewed UI. | Yes |
| `TODO` | Legacy student/parent/teacher page stubs | Yes if route reached directly | Replaced TODO text with product-safe directional messages. | Yes |
| `Lorem` | No user-facing hits | No | No action needed. | Yes |
| `backend` | Service code, route metadata, local variable names | No | No visible UI copy changed; developer identifiers are allowed. | Yes |
| `provider` | Service/doc/code identifiers | No | No visible UI copy changed; developer identifiers are allowed. | Yes |
| `AI` | Route alias `/ai-homework-help`, previous component name | Mostly non-copy | Renamed `AIResponseFeedback` to `LearningResponseFeedback`; public route alias remains for compatibility and page copy does not present AI as the product. | Yes |
| `model` / `prompt` | Analytics privacy blocklist, Practice challenge fields, one homepage detail | Mixed | Changed user-facing homepage `prompt` detail to `hint`; kept technical fields and privacy blocklist. | Yes |

## Classification Rule

Phase 32 targets text a normal user can see in the browser. Developer docs, tests, internal data helper names, service fallback names, route metadata, analytics event identifiers, and hidden debug surfaces can retain precise implementation wording when they are not rendered in production-facing UI.

## Commands Used

```bash
rg -n "demo|Demo|mock|Mock|Codex|placeholder|TODO|Lorem|test account|admin accounts|under development|backend|provider|Artificial Intelligence|as an AI|language model|human backup|teacher backup|what we are selling|buy now" src src/i18n
rg -n "AI|model|prompt" src src/i18n
```
