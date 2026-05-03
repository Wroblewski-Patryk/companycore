# Google Drive V2 Task Contracts

This file is the execution queue for the approved Google Drive v2 integration.
It follows the repository task contract and must stay synchronized with
`.codex/context/TASK_BOARD.md` and `docs/planning/mvp-next-commits.md`.

## V2GD-001 Google Drive Architecture And Queue

- Task Type: architecture/planning
- Current Stage: done
- Deliverable For This Stage: approved architecture delta, provider-docs
  evidence, and executable v2 queue.
- Goal: Define how Google Drive, Docs, and Sheets map into the existing
  CompanyCore operating model so implementation can proceed without creating a
  parallel document system.
- Scope:
  - `docs/architecture/system-architecture.md`
  - `docs/INTEGRATIONS.md`
  - `docs/DATABASE.md`
  - `.codex/context/PROJECT_STATE.md`
  - `.codex/context/TASK_BOARD.md`
  - `docs/planning/mvp-next-commits.md`
  - `docs/planning/google-drive-v2-task-contracts.md`
- Implementation Plan:
  - Review current official Google Drive, Docs, and Sheets API documentation.
  - Record the provider mapping and source-of-truth boundaries.
  - Activate the first executable Google Drive v2 tasks in canonical queues.
  - Keep implementation slices small, testable, and reversible.
- Acceptance Criteria:
  - Google Drive hierarchy is mapped to CompanyCore workspace/area/folder/table
    scope.
  - OAuth, token storage, Drive Changes API, Docs read/edit, and Sheets
    read/edit/create assumptions are explicit.
  - Jarvis/Paperclip/Aviary access goes through CompanyCore APIs.
  - Next implementation tasks are queued.
- Definition of Done:
  - Architecture, integration, database, project state, task board, and next
    commit queue are aligned.
  - Provider documentation evidence is referenced.
  - No runtime code behavior changes are introduced in this planning slice.
- Result Report:
  - Official Google Workspace docs were checked for Drive file discovery,
    Drive metadata, Drive file creation, Drive changes/watch, Docs get/edit,
    and Sheets create/read/write behavior.
  - Google Drive was recorded as the next native adapter using the existing
    workspace settings, encrypted secrets, provider client, sync service,
    event inbox, and agent outbox pattern.
  - V2GD-002 through V2GD-006 were activated as the implementation queue.

## V2GD-002 Google Drive Persistence Foundation

- Task Type: database/backend
- Current Stage: done
- Deliverable For This Stage: Prisma migration and tests for workspace-scoped
  Drive folder/file/content persistence.
- Goal: Add durable Google Drive metadata and content snapshot tables that keep
  file discovery idempotent and searchable.
- Scope:
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
  - `docs/DATABASE.md`
  - targeted tests under `tests/`
- Implementation Plan:
  - Add `google_drive_files` for Drive folders/files with workspace ownership,
    external ID uniqueness, parent metadata, MIME type, links, revision signal,
    trashed state, selected operating scope, and sync status.
  - Add `google_drive_content_snapshots` for extracted text, summaries, sheet
    previews, scan status, source revision, and safe metadata.
  - Add indexes for workspace/folder traversal and provider idempotency.
  - Add tests proving cross-workspace isolation and duplicate prevention.
- Acceptance Criteria:
  - Re-importing the same Drive file updates one row instead of duplicating it.
  - A file can be attached to an operating area/folder/table, storage location,
    or knowledge root inside the same workspace only.
  - Content snapshots can be refreshed without duplicating file metadata.
  - Migration validates on an empty and existing local database.
- Definition of Done:
  - `npm run build` and `npm test` pass with the project PostgreSQL test URL.
  - `git diff --check` passes.
  - Database docs are updated.
- Result Report:
  - Added `google_drive_files` and `google_drive_content_snapshots`.
  - Added idempotency constraints for Drive file metadata and file/revision
    content snapshots.
  - Added workspace/scope indexes for folder traversal and future dashboard
    filtering.
  - Added tests proving same-workspace upsert idempotency, cross-workspace
    external ID separation, and snapshot refresh without duplicates.

## V2GD-003 Google Drive Provider Client And OAuth Settings

- Task Type: backend/integration
- Current Stage: done
- Deliverable For This Stage: workspace-owned Google Drive settings, encrypted
  OAuth token storage contract, and safe provider client.
- Goal: Allow an owner to connect Google Drive through OAuth-backed workspace
  settings without exposing tokens to clients, logs, or agents.
- Scope:
  - `src/integrations/google-drive/*`
  - `src/modules/integration-settings/*`
  - `docs/INTEGRATIONS.md`
  - tests for token redaction and missing/invalid settings
- Implementation Plan:
  - Add provider constant `google_drive`.
  - Store refresh-token material encrypted in `integration_settings`.
  - Store non-secret selected folder/shared-drive config and Drive changes page
    token in settings config.
  - Build a safe HTTP client for Drive, Docs, and Sheets APIs.
- Acceptance Criteria:
  - Missing settings fail closed with `integration_not_configured`.
  - Responses never include refresh/access tokens.
  - Provider errors are mapped to safe integration error codes.
- Definition of Done:
  - Build/tests pass and integration docs are updated.
- Result Report:
  - Added `google_drive` as a supported integration provider.
  - Added encrypted OAuth secret storage and typed non-secret Drive
    configuration for selected folders, shared drives, sync mode, import mode,
    Drive changes token, and operating scope mappings.
  - Added a safe Google Drive/Docs/Sheets client boundary with provider error
    mapping.
  - Added connection manifest/config status entries so agents can discover
    Google Drive capability without seeing OAuth material.
  - Added tests proving settings redaction and backend-only OAuth decrypt
    access.

## V2GD-004 Folder Discovery And File Import

- Task Type: backend/integration
- Current Stage: done
- Deliverable For This Stage: selected folder discovery/import endpoint with
  explicit import policy.
- Goal: Import selected Drive folder/file structure into CompanyCore storage
  and knowledge records with no duplicates.
- Scope:
  - `src/integrations/google-drive/*`
  - `src/modules/operating-model/*`
  - tests for import policy and workspace scoping
- Implementation Plan:
  - Use Drive `files.list` with pagination and selected-folder queries.
  - Persist folders/files by workspace/provider/external ID.
  - Support `merge`, `skip_existing`, `replace_selected_folders`, and
    `inspect_only`.
  - Emit safe sync events and agent outbox signals.
- Acceptance Criteria:
  - Repeated imports are clean and idempotent.
  - Destructive replacement only affects provider-owned Drive rows in selected
    folders.
  - Jarvis can read imported file metadata through CompanyCore API.
- Definition of Done:
  - Build/tests pass, docs updated, no token leakage.
- Result Report:
  - Added `POST /v1/integration-settings/google_drive/import`.
  - Added selected-folder file discovery through Drive `files.list`.
  - Added `merge`, `skip_existing`, `replace_selected_folders`, and
    `inspect_only` import behavior.
  - Added idempotent persistence into `google_drive_files`.
  - Added `google_drive_import_succeeded` events with safe counts.
  - Added tests for inspect-only, initial merge, repeated merge, and imported
    file metadata refresh.

## V2GD-005 Docs And Sheets Read/Create/Edit

- Task Type: backend/integration
- Current Stage: done
- Deliverable For This Stage: API routes for Docs/Sheets create/read/edit and
  post-write local refresh.
- Goal: Let CompanyCore create, read, and edit Google Docs/Sheets while keeping
  database metadata and searchable snapshots current.
- Scope:
  - `src/integrations/google-drive/*`
  - new or existing file/content API modules
  - tests for docs/sheets read/edit behavior with mocked provider responses
- Implementation Plan:
  - Create Docs through Drive `files.create` or Docs-compatible metadata flow.
  - Create Sheets through Sheets `spreadsheets.create`.
  - Read Docs with `documents.get`; read Sheets with spreadsheet/values APIs.
  - Edit Docs with `documents.batchUpdate`; edit Sheets with values update or
    batchUpdate.
  - After successful provider writes, refresh metadata and content snapshots.
- Acceptance Criteria:
  - Provider write failure does not mutate local content snapshots.
  - Successful provider write updates the local snapshot and emits events.
  - Agents can request content through CompanyCore APIs without Google tokens.
- Definition of Done:
  - Build/tests pass and docs are updated.
- Result Report:
  - Added `/v1/google-drive/files` and
    `/v1/google-drive/files/:id/content`.
  - Added Google Docs create/update routes with provider write before local
    refresh.
  - Added Google Sheets create/update values routes with provider write before
    local refresh.
  - Added content extraction snapshots for Docs text and Sheets values.
  - Added safe file/content events for creation, updates, and refreshes.
  - Added tests proving Docs/Sheets provider calls, snapshot refresh, and agent
    file listing behavior.

## V2GD-006 Drive Changes Freshness

- Task Type: backend/integration
- Current Stage: done
- Deliverable For This Stage: Drive changes reconciliation and future webhook
  channel plan.
- Goal: Keep CompanyCore file metadata and content snapshots fresh after
  external Drive edits.
- Scope:
  - `src/integrations/google-drive/*`
  - provider event inbox/outbox reuse
  - docs and tests for idempotent change handling
- Implementation Plan:
  - Store start/new page tokens per workspace setting.
  - Poll Drive `changes.list` non-destructively for selected scopes.
  - Record change deliveries in provider event inbox.
  - Re-fetch changed files and refresh snapshots when relevant.
  - Add `changes.watch` channel registration as a later push trigger using the
    existing webhook registration model.
- Acceptance Criteria:
  - Replaying the same change does not duplicate files or events.
  - Removed/trashed files are marked safely without deleting native data.
  - Agent outbox receives provider-neutral file changed events.
- Definition of Done:
  - Build/tests pass, docs updated, smoke plan created.
- Result Report:
  - Added Drive changes reconciliation through
    `/v1/integration-settings/google_drive/changes/reconcile`.
  - Added provider event inbox records for Drive changes.
  - Added agent outbox events for changed and removed Drive files.
  - Added metadata/content refresh for changed Docs/Sheets.
  - Added safe removed-file handling by marking provider-owned rows as
    `trashed`/`removed` instead of deleting native data.
  - Added changes page token advancement in Google Drive integration config.
  - Added tests for changed file refresh, removed file marking, inbox rows,
    agent outbox rows, and page-token update.
