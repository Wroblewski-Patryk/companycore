# Web Console V2 Task Contracts

## V2WEB-005 Dedicated Tasks Adapter View

- Task Type: design/frontend
- Current Stage: done
- Deliverable For This Stage: dedicated `/tasks-adapter` owner-console route that
  reuses the implemented `/v1/tasks` data path and keeps dashboard as a
  summary/navigation surface.
- Goal: Move task and ClickUp adapter data toward the target module
  architecture without inventing new backend contracts.
- Scope:
  - `public/index.html`
  - `public/app.js`
  - `public/styles.css`
  - `src/app.ts`
  - `.codex/context/PROJECT_STATE.md`
  - `.codex/context/TASK_BOARD.md`
  - `docs/planning/mvp-next-commits.md`
  - `docs/planning/web-console-v2-task-contracts.md`
- Implementation Plan:
  - Add `/tasks-adapter` to authenticated web routes and signed-in navigation.
  - Move the existing implemented task table out of dashboard into the new
    route.
  - Add compact task summary cards for total, ClickUp, open, and due-soon
    records.
  - Keep links back to ClickUp settings so adapter configuration remains
    discoverable.
  - Validate syntax, build, tests, local route rendering, and production smoke.
- Acceptance Criteria:
  - Signed-in navigation includes `Tasks & adapters`.
  - `/tasks-adapter` renders the implemented task records from `/v1/tasks`.
  - Dashboard links to `/tasks-adapter` but no longer owns the task table
    surface.
  - Direct refresh of `/tasks-adapter` returns the SPA shell.
  - Legacy API `/tasks` remains protected API-compatible.
  - Task table rendering does not inject provider-controlled fields as HTML.
- Definition of Done:
  - `node --check public/app.js`, `git diff --check`, `npm run build`, and
    `npm test` pass.
  - Browser smoke verifies `/tasks-adapter` and `/dashboard` render on
    desktop.
  - Project state, task board, and next-commits docs are updated.
- Result Report:
  - Added `/tasks-adapter` to the authenticated frontend route list and Express
    web app route allowlist.
  - Moved the implemented task table out of the dashboard into a dedicated
    Tasks & adapters view.
  - Added total, ClickUp, open, and due-soon task stat cards.
  - Preserved legacy protected API `/tasks` by avoiding a web route collision;
    the GUI reads the implemented `/v1/tasks` endpoint.
  - Replaced provider-controlled task table HTML injection with text-node cell
    rendering.
  - `node --check public/app.js`, `git diff --check`, `npm run build`, and
    `npm test` passed.
  - Playwright smoke verified desktop `/tasks-adapter` route rendering,
    active navigation, task rows, summary stats, and dashboard module links.

## V2WEB-004 Dedicated Operating Areas View

- Task Type: design/frontend
- Current Stage: done
- Deliverable For This Stage: dedicated `/areas` owner-console route that
  reuses the existing operating-map data and manual mapping controls without
  changing backend contracts.
- Goal: Move the 12-area company operating map toward the target information
  architecture by giving operating areas their own module view while keeping
  the dashboard focused on summary and navigation.
- Scope:
  - `public/index.html`
  - `public/app.js`
  - `public/styles.css`
  - `src/app.ts`
  - `.codex/context/PROJECT_STATE.md`
  - `.codex/context/TASK_BOARD.md`
  - `docs/planning/mvp-next-commits.md`
  - `docs/planning/web-console-v2-task-contracts.md`
- Implementation Plan:
  - Add `/areas` to the authenticated web route allowlist and signed-in
    navigation.
  - Move the existing operating-map panel into a dedicated `/areas` view,
    preserving all DOM IDs used by current render and mapping logic.
  - Replace the dashboard embedded map with a concise module launch panel that
    links to the new route.
  - Validate JavaScript syntax, build, integration tests, and desktop/mobile
    route rendering.
- Acceptance Criteria:
  - Signed-in navigation includes `Operating areas` as its own route.
  - `/areas` renders the existing 12-area operating map and manual mapping
    controls.
  - Dashboard remains a summary surface with a clear link to `/areas`.
  - Existing `/settings`, `/settings/drive`, and `/settings/api` routes still
    render.
- Definition of Done:
  - `node --check public/app.js`, `git diff --check`, `npm run build`, and
    `npm test` pass.
  - Browser smoke verifies `/dashboard` and `/areas` render on desktop and
    mobile.
  - Project state, task board, and next-commits docs are updated.
- Result Report:
  - Added `/areas` to the authenticated frontend route list and Express web
    app route allowlist.
  - Moved the existing operating map into a dedicated Operating Areas view
    without changing backend contracts or duplicating mapping logic.
  - Replaced the dashboard embedded map with a module launch panel linking to
    Operating Areas, ClickUp settings, and Google Drive.
  - Preserved the existing manual provider/Drive area selectors because the
    original operating-map DOM IDs remain single-owner in the new route.
  - Verified direct `/areas` refresh returns `index.html` instead of falling
    through to protected API auth.
  - `node --check public/app.js`, `git diff --check`, `npm run build`, and
    `npm test` passed.
  - Playwright smoke verified desktop `/areas`, desktop `/dashboard`, and
    mobile sidebar behavior.

## V2WEB-002 Manual Provider Scope Mapping

- Task Type: frontend/backend-integration
- Current Stage: done
- Deliverable For This Stage: editable provider-to-operating-area mapping in
  the owner web console, with API support for ClickUp mappings and Google Drive
  folders.
- Goal: Let the operator correct automatic integration mapping so ClickUp
  Lists/Folders/Spaces and Google Drive parent folders can be assigned to the
  right company area after import.
- Scope:
  - `public/app.js`
  - `public/styles.css`
  - `src/modules/operating-model/operating-model.routes.ts`
  - `src/modules/google-drive/google-drive.routes.ts`
  - `src/modules/connection/connection.routes.ts`
  - `src/operating-model/clickup-structure.ts`
  - `src/tests/api.test.ts`
  - `.codex/context/PROJECT_STATE.md`
  - `.codex/context/TASK_BOARD.md`
  - `docs/planning/mvp-next-commits.md`
- Implementation Plan:
  - Add owner API endpoints for updating an external provider mapping scope and
    a Google Drive file/folder scope.
  - Preserve manual ClickUp area overrides during future structure refreshes.
  - Persist Google Drive folder-to-area mappings in integration settings so
    future imports keep the selected area.
  - Add compact area selectors in the dashboard provider mapping and Drive
    folder lists.
  - Cover the new manifest capabilities, ClickUp mapping scope update, and
    Drive folder descendant update in integration tests.
- Acceptance Criteria:
  - An owner can move a ClickUp List mapping to another operating area.
  - The linked ClickUp operating table moves with the mapping.
  - Future ClickUp structure refreshes preserve the manual area override.
  - An owner can move a Google Drive folder to another operating area.
  - Existing Drive descendants move with the folder and the folder mapping is
    persisted for future imports.
  - Jarvis/Paperclip can discover the new write capabilities through
    `/v1/connection`.
- Definition of Done:
  - `node --check public/app.js`, `git diff --check`, `npm run build`, and
    `npm test` pass.
  - Dashboard controls use the existing operating-map design system.
  - Project state, task board, and next-commits docs are updated.
- Result Report:
  - Added `PATCH /v1/operating-model/external-mappings/:id/scope`.
  - Added `PATCH /v1/google-drive/files/:id/scope`.
  - Added adapter manifest capabilities for provider mapping writes and Drive
    file scope writes.
  - Added dashboard selectors for ClickUp provider mappings and Google Drive
    folders.
  - ClickUp manual area overrides are stored in mapping raw data and table
    sync policy, then preserved during structure refreshes.
  - Google Drive folder area choices update descendants and persist an
    `operatingScopeMappings` entry for future imports.
  - `node --check public/app.js`, `git diff --check`, `npm run build`, and
    `npm test` passed.

## V2WEB-001 Operating Map And Google Drive Console

- Task Type: frontend/backend-routing
- Current Stage: done
- Deliverable For This Stage: owner web console that exposes the 12 company
  areas, mapped CompanyCore tables, live database counts, ClickUp/Drive
  provider mappings, and Google Drive connection actions.
- Goal: Let an owner see how CompanyCore is filling the company database after
  ClickUp and Google Drive are connected.
- Scope:
  - `public/index.html`
  - `public/app.js`
  - `public/styles.css`
  - `src/app.ts`
  - `.codex/context/PROJECT_STATE.md`
  - `.codex/context/TASK_BOARD.md`
  - `docs/planning/mvp-next-commits.md`
- Implementation Plan:
  - Add `/settings/drive` to the web app route allowlist.
  - Extend the dashboard with a 12-area company operating map that follows the
    provided folder-style visual reference.
  - Read `/v1/connection`, `/v1/operating-model`, `/v1/tasks`, and
    `/v1/google-drive/files` into one dashboard state.
  - Show CompanyCore table counts, provider mappings, Drive files, and record
    previews per operating area.
  - Add a Google Drive settings screen for OAuth URL generation, authorization
    code exchange, folder import, change reconciliation, and imported-file
    review.
  - Keep raw tokens and API keys out of UI output and docs.
- Acceptance Criteria:
  - Owner dashboard shows all 12 company areas.
  - Selecting an area updates tables, Drive files, mappings, and database
    preview without a page reload.
  - Google Drive settings support OAuth URL generation, code exchange, import,
    reconcile, and file refresh actions.
  - The web app can deep-link to `/settings/drive`.
  - Build and tests pass.
- Definition of Done:
  - `git diff --check`, `npm run build`, and `npm test` pass.
  - Browser smoke verifies dashboard and Drive settings render.
  - Project state, task board, and next-commits docs are updated.
- Result Report:
  - Added `/settings/drive` to the web app route allowlist and top navigation.
  - Added a dashboard operating map with 12 company areas in the operator's
    folder order: Strategy, Product, Sales, Operations, Relationships, People,
    Finance, Assets, Technology, Legal, Innovation, and Management.
  - Dashboard now combines the operating model, table counts, provider
    mappings, Drive files, and record previews from protected CompanyCore APIs.
  - Added Google Drive settings UI for OAuth URL generation, authorization-code
    exchange, folder import, change reconciliation, file refresh, and imported
    file review.
  - Verified desktop and mobile browser rendering with Playwright screenshots.
  - `node --check public/app.js`, `git diff --check`, `npm run build`, and
    `npm test` passed.
  - Deployed to production as backend image
    `rnqqkhl3o3dut4qv56mlxly2_backend:6b4d57a6e98159e64d9f065427e7201238b47ab5`.
  - Production public smoke passed for `/health`, `/v1/health`, web root, and
    `/settings/drive`.
  - Production protected smoke returned workspace `LuckySparrow`, 12 operating
    areas, 47 capabilities, Google Drive unconfigured, and 0 imported Drive
    files.
