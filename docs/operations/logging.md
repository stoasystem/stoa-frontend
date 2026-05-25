# Frontend Logging

The frontend logger lives in `src/services/logging/` and provides:

- `logger.debug`
- `logger.info`
- `logger.warn`
- `logger.error`

## Environment Behavior

Logger output is gated by `VITE_APP_ENV`:

- `development`: `debug`, `info`, `warn`, and `error`.
- `staging`: `info`, `warn`, and `error`.
- `production`: `warn` and `error`.

Unknown environments use development-level output so local or preview environments remain inspectable.

## Sensitive Data Rules

Do not pass raw user input, chat messages, uploaded file content or metadata, passwords, tokens, cookies, authorization headers, or API request/response bodies to the logger.

The logger defensively redacts object keys that look sensitive, including:

- `authorization`
- `bearer`
- `chat`
- `conversation`
- `cookie`
- `file`
- `password`
- `secret`
- `token`

It also limits string length, array length, object key count, and nesting depth. This redaction is a safety net, not permission to log sensitive payloads.
