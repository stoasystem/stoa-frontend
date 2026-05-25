# Frontend Error Monitoring

The frontend reports React error boundary failures to the backend endpoint:

```text
POST /monitoring/frontend-errors
```

Reports are sent through the shared `httpClient`, so normal API base URL and auth behavior apply.

## Environment Behavior

Frontend monitoring is controlled by `VITE_ENABLE_FRONTEND_MONITORING`:

- `true`: always send reports.
- `false`: never send reports.
- unset: send in `staging` and `production`; skip in `development`.

The app environment is read from `VITE_APP_ENV` and included in every report as `appEnv`.

## Payload

The monitoring service sends a bounded, sanitized payload:

```json
{
  "appEnv": "staging",
  "componentStack": "at AppRouter ...",
  "errorId": "generated-client-id",
  "message": "Cannot read properties of undefined",
  "name": "TypeError",
  "route": "/dashboard",
  "source": "app-error-boundary",
  "stack": "TypeError: ...",
  "timestamp": "2026-05-25T12:00:00.000Z"
}
```

`route` contains only the current pathname. Query strings and hashes are not sent.

## Sanitization Rules

Monitoring reports must not include chat content, file content, passwords, tokens, cookies, authorization headers, or arbitrary component props/state.

The service:

- sends only a fixed allowlist of fields,
- does not send request bodies, app state, user input, props, or file metadata,
- redacts JWT-like values and bearer tokens,
- drops stack frames that contain sensitive key patterns,
- truncates long messages and stack frames.

If the reporting request fails, the error boundary still renders its fallback UI. Reporting failures are logged through the frontend logger and are never thrown from the error handling path.
