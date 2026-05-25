# Support ticket UI

Phase 11 adds frontend support ticket surfaces:

- `/support/tickets`
- `/support/tickets/:ticketId`
- `/admin/support`
- `/admin/support/:ticketId`

## Contract

- `POST /support/tickets`
- `GET /support/tickets`
- `GET /support/tickets/:ticketId`
- `GET /admin/support/tickets`
- `PATCH /admin/support/tickets/:ticketId`

The current implementation uses demo fallback data for local development. It is not a production support backend.
