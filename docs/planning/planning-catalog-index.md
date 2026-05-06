# Planning Catalog Index

Use this file when the repository accumulates many planning files and needs a
clear distinction between active, historical, blocked, and superseded plans.

## Purpose

This index prevents agents from treating every old planning file as active
work.

Canonical queue sources should still remain:

- `docs/planning/mvp-execution-plan.md`
- `docs/planning/mvp-next-commits.md`

## Classification Legend

- `queued`
  explicitly owned by the current canonical queue
- `implemented`
  delivered and closed in canonical queues or closure notes
- `external-blocked`
  implementation mostly complete, waiting on production-only evidence or
  external dependency
- `superseded`
  historical or replaced by newer canonical planning artifacts

## Active Catalog

| Planning file | Classification | Canonical ownership | Notes |
| --- | --- | --- | --- |
| `docs/planning/agent-runtime-gap-closure-plan.md` | queued | `AGRUN-002..AGRUN-010` | Current post-CRUD agent runtime hardening and onboarding queue. |
| `docs/planning/agent-crud-api-rollout-plan.md` | implemented | `AGCRUD-001..AGCRUD-006` | Completed and deployed agent CRUD rollout. |
| `docs/planning/web-console-v2-task-contracts.md` | implemented | `V2WEB-001..V2WEB-021` | Historical completed web-console slices; deeper editing is re-queued through AGRUN-008. |
| `docs/planning/google-drive-v2-task-contracts.md` | implemented | `V2GD-001..V2GD-009` | Server-side Google Drive v2 delivered; real owner consent/import proof is re-queued through AGRUN-007. |

## Rules

- update this index only when planning volume is large enough to justify it
- do not treat `superseded` items as active execution sources
- when a plan is completed or replaced, update this index in the same planning
  maintenance task
