# Backup And Restore Runbook

Phase: 46 privacy, backup, pricing, and billing preparation
Status: pilot preparation

## Purpose

This runbook distinguishes local SQLite fallback expectations from production database
backup expectations, then lists frontend checks to run after a restore. It supports
BACKUP-01, BACKUP-02, and BACKUP-03.

## SQLite Fallback

SQLite fallback is appropriate for local development, demos, or limited staging recovery
only. It is not the expected production durability model.

- Store the SQLite database file outside committed source directories.
- Before risky local operations, stop the backend process and copy the database file to
  a timestamped backup location.
- Restore by stopping the backend, replacing the active SQLite file with the selected
  backup, restarting the backend, and confirming application health.
- Treat SQLite backup copies as sensitive because they may include account, learning,
  parent, tutor, and upload metadata.
- Do not use SQLite file copies as the only backup mechanism for production.

## Production Database Expectations

Production should use a managed database backup strategy with point-in-time recovery
instead of manual file copies.

- Enable automated backups with point-in-time recovery for the production database.
- Define retention windows for primary backups, PITR logs, snapshots, and deleted data.
- Encrypt backups at rest and restrict restore permissions to authorized operators.
- Test restore into an isolated environment before replacing or repairing production.
- Record each restore with timestamp, operator, source snapshot or recovery point,
  target environment, validation results, and rollback decision.

## Restore Procedure

1. Identify the incident, affected environment, and desired recovery point.
2. Pause writes or route traffic away from the affected backend when required.
3. Restore the selected SQLite backup or production recovery point into an isolated target.
4. Run backend health checks and schema migration checks.
5. Run frontend restore checks against the restored backend.
6. Promote the restored environment only after validation passes and stakeholders approve.
7. Keep the original failed environment until the incident review confirms it is safe to remove.

## Frontend Restore Checks

Run these checks after any database restore because stale or partially restored data is
visible through the React frontend.

- Log in as each active role: student, parent, tutor, and admin where available.
- Confirm the dashboard route for each role loads without authorization loops.
- Open a student chat and confirm conversation history renders or shows a clear empty state.
- Confirm parent child summaries, reports, and learning history do not show orphaned or
  unauthorized student records.
- Confirm tutor request lists and request detail pages do not reference missing messages.
- Confirm `/privacy`, `/terms`, `/pricing`, and `/billing` remain reachable as expected.
- Confirm the browser console and API responses do not show repeated 401, 404, or 500
  errors after session refresh.

## Production Readiness Gap

Phase 46 documents backup and restore expectations but does not configure production
database backups, PITR, monitoring, alerting, or automated restore tests.
