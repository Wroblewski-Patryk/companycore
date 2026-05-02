# ClickUp Owner Console Deployment Plan

## Goal

Ship the v1 owner console as a humane ClickUp setup flow:

1. Owner logs in to CompanyCore.
2. Owner pastes a ClickUp personal token.
3. CompanyCore discovers ClickUp Workspaces available to that token.
4. Owner selects the ClickUp Workspace, Spaces/Folders, and Lists to sync.
5. Owner saves the connection.
6. Owner runs the first sync.
7. Jarvis, Paperclip, Aviary, and future agents read synced data through
   CompanyCore API keys.

## ClickUp API Findings

Official ClickUp documentation confirms the missing selection layer:

- Personal tokens are tied to the ClickUp user account and can access every
  Workspace the user has created or joined, limited by that user's permissions.
- `GET https://api.clickup.com/api/v2/team` returns Workspaces available to the
  authenticated token.
- ClickUp API path params still use `team_id` for Workspace ID.
- `GET /api/v2/team/{team_id}/space` returns Spaces in a Workspace.
- `GET /api/v2/space/{space_id}/folder` returns Folders in a Space.
- `GET /api/v2/folder/{folder_id}/list` returns Lists inside a Folder.
- `GET /api/v2/space/{space_id}/list` returns folderless Lists.
- `GET /api/v2/team/{team_Id}/task` can filter by `list_ids[]`, includes
  pagination from page `0`, and supports `include_closed`, `subtasks`, and
  `include_markdown_description`.

Sources:

- `https://help.clickup.com/hc/en-us/articles/6303422883095-Create-your-own-app-with-the-ClickUp-API`
- `https://developer.clickup.com/reference/getauthorizedteams`
- `https://developer.clickup.com/reference/getspaces`
- `https://developer.clickup.com/reference/getfolders`
- `https://developer.clickup.com/reference/getlists`
- `https://developer.clickup.com/reference/getfolderlesslists`
- `https://developer.clickup.com/reference/getfilteredteamtasks`

## Required v1 UX

The first production-ready owner console must not require manual ID lookup.

### Login State

- Show owner email/password login.
- Persist bearer token only in `sessionStorage`.
- After login, show workspace name and ClickUp connection status.

### Token Validation State

- Owner pastes ClickUp personal token.
- Owner clicks `Check token`.
- Backend calls ClickUp using the submitted token without storing it yet.
- UI shows available ClickUp Workspaces.
- If the token fails, show a local recovery message and do not save anything.

### Workspace Selection State

- Owner selects one ClickUp Workspace.
- Backend discovers Spaces, Folders, folderless Lists, and folder Lists for the
  selected Workspace.
- UI shows a grouped tree:
  - Workspace
  - Space
  - Folder
  - List checkbox
  - folderless Lists under the Space

### Save State

- Owner selects one or more Lists.
- Owner toggles `Active`.
- Owner clicks `Save connection`.
- Backend encrypts and stores the token as workspace-owned integration
  settings with:
  - `teamId`
  - selected `spaceIds`
  - selected `folderIds`
  - selected `listIds`
  - `syncMode = pull`
  - safe display metadata such as selected names if useful

### Sync State

- Owner clicks `Sync now`.
- Backend runs native ClickUp pull sync.
- UI shows safe counts:
  - items fetched
  - created
  - updated
  - skipped
- UI links the result to latest sync events when available.

### Existing Connection State

- Existing token must never be returned.
- UI shows `secretConfigured = true`.
- Token field placeholder says that leaving it blank keeps the saved token.
- Owner can update selected Lists without re-entering the token.
- Owner can replace the token by entering a new one and saving.

## Backend Implementation Plan

### 1. Extend ClickUp Client

Add provider client methods:

- `getAuthorizedWorkspaces(token)`
- `getSpaces(teamId)`
- `getFolders(spaceId)`
- `getFolderLists(folderId)`
- `getFolderlessLists(spaceId)`
- keep `getWorkspaceTasks({ teamId, listIds })`

Provider responses must be normalized into safe internal shapes before reaching
routes.

### 2. Add Discovery Route

Add owner-protected route:

```http
POST /v1/integration-settings/clickup/discover
```

Payload:

```json
{
  "token": "clickup-personal-token",
  "teamId": "optional-clickup-workspace-id"
}
```

Behavior:

- If `teamId` is omitted, return available Workspaces only.
- If `teamId` is provided, return the selected Workspace's Spaces, Folders, and
  Lists.
- Do not store the submitted token.
- Do not return raw provider errors.
- Do not log token or raw ClickUp response bodies.

Safe response shape:

```json
{
  "data": {
    "workspaces": [
      {
        "id": "123",
        "name": "LuckySparrow"
      }
    ],
    "spaces": [
      {
        "id": "456",
        "name": "Operations",
        "lists": [],
        "folders": [
          {
            "id": "789",
            "name": "Company",
            "lists": [
              {
                "id": "101112",
                "name": "Jarvis"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 3. Keep Settings Route As The Save Boundary

Continue using:

```http
PUT /v1/integration-settings/clickup
```

The route remains the only place where ClickUp token material is encrypted and
stored.

### 4. Improve Native Sync Pagination

`GET /api/v2/team/{team_Id}/task` is limited to 100 tasks per page. The native
sync must page from `page=0` until an empty or short page is returned, while
keeping the current idempotent upsert rule:

```text
(workspace_id, source = clickup, external_id)
```

### 5. Future Continuous Updates

Do not implement continuous updates in this same task. After first production
pull succeeds, choose one follow-up:

- scheduled pull sync in Coolify
- ClickUp webhook receiver with signature validation and workspace mapping
- n8n calling `POST /v1/tasks/sync/clickup/native`

Recommended v1.1 default: scheduled pull sync first, webhook later when event
volume and required freshness justify it.

## Frontend Implementation Plan

Update the minimal owner console from manual ID entry to a guided setup:

1. Login panel.
2. ClickUp token panel with `Check token`.
3. Workspace select.
4. Space/folder/list checklist.
5. Save connection.
6. Sync now.
7. Safe status/result area.

Expected states:

- loading token validation
- invalid token
- no Workspaces available
- selected Workspace loading
- no Lists available
- settings saved
- sync success
- sync failed

Responsive expectations:

- desktop: two-column setup with list tree on the right
- tablet: stacked panels
- mobile: single-column controls, larger hit targets, no horizontal overflow

Accessibility expectations:

- labels for all inputs/selects
- field-level error messages
- keyboard-selectable checkbox tree
- visible focus state
- no token rendered back into DOM after save

## Deployment Plan

### Pre-Deploy Checks

- `npm run build`
- `npm test` with disposable PostgreSQL if integration routes/tests change
- local smoke:
  - `GET /`
  - owner login
  - invalid token discovery fails safely
  - valid token discovery returns Workspaces
  - selected Workspace returns Lists
  - save settings redacts token
  - native sync creates/updates tasks

### Production Smoke

1. Deploy to Coolify.
2. Open `https://api.companycore.luckysparrow.ch/`.
3. Log in as owner.
4. Paste ClickUp personal token.
5. Discover and select ClickUp Workspace.
6. Select Lists.
7. Save connection.
8. Run `Sync now`.
9. Verify task count in UI.
10. Verify Jarvis reads synced tasks through CompanyCore after CCV1-028 deploy.

### Rollback

- If the owner console fails but API remains healthy, redeploy previous commit.
- If settings save wrote wrong list config, update settings through the UI or
  `PUT /v1/integration-settings/clickup`.
- Preserve PostgreSQL volume.

## Task Split

### CCV1-031 ClickUp Discovery Backend

- Add client methods for Workspaces, Spaces, Folders, Lists.
- Add `POST /v1/integration-settings/clickup/discover`.
- Add tests for invalid token safe failure and valid mocked discovery shapes.
- Add pagination to task sync.

### CCV1-032 Guided Owner Console

- Replace manual `teamId/listIds` entry with discovery-driven selection.
- Keep advanced/manual fields hidden or removed from the primary flow.
- Add loading, empty, error, saved, and synced UI states.
- Run desktop/tablet/mobile checks.

### CCV1-033 Production Deploy And Smoke

- Deploy backend + owner console.
- Run production owner setup.
- Run native sync.
- Verify Jarvis/Paperclip/Aviary can read CompanyCore data with their service
  API keys after their app-side connectors are active.

## Open Decisions

- Whether v1.1 continuous updates use scheduled pull sync or ClickUp webhooks.
- Whether OAuth should replace personal tokens in v2 if external users beyond
  the owner are added.
