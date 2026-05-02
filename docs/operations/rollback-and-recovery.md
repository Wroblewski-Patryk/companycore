# Rollback And Recovery

Document the first safe rollback path before the first production deploy.

## Rollback Triggers

- Failed `GET /health` after deploy.
- Failed `prisma migrate deploy`.
- Auth or workspace bootstrap failure after deploy.
- Data ownership regression or cross-workspace leakage.
- Native integration sync corrupts, duplicates, or loses data.
- Operator evidence to capture first: failing command, deployment version,
  migration name, relevant logs with secrets redacted, and smoke step result.

## Rollback Method

- App rollback: redeploy the previous known-good commit/image.
- Database rollback or recovery:
  - Prefer forward-fix migrations for already-applied production migrations.
  - Restore from backup only when data corruption or unsafe ownership migration
    requires it.
  - Never run ad hoc schema edits directly against production without a
    documented recovery decision.
- Worker rollback: not applicable in v1 because there are no worker services.
- Cache or queue considerations: not applicable in v1.

## Recovery Verification

- Health checks: `GET /health`.
- User journey smoke: owner auth/bootstrap, protected workspace project/task
  call, denied unauthorized or cross-workspace call, ClickUp sync when
  configured, event readback.
- Log review: backend startup, migration output, auth failures, integration
  failures, and event creation failures.
- Data integrity review: confirm workspace-scoped records remain associated
  with the expected workspace and external sync idempotency is preserved.

## Notes

- Prefer deterministic rollback or forward-fix rules over improvisation.
- If rollback is unsafe for a given change type, record the required mitigation
  before deployment.
