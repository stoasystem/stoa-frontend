# Operational dashboard

Phase 11 adds `/admin/analytics` as a frontend operational overview.

## Contract

`GET /admin/analytics/overview`

Expected fields:

- active users
- weekly active students
- new registrations
- messages sent
- files uploaded
- teacher help requests
- parent report views
- checkout started
- checkout completed
- cancelled subscriptions

The dashboard is for demo and operator workflow validation. It does not implement a production analytics warehouse.
