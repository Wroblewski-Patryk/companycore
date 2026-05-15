# V1 Settings Canonical Spec

Date: 2026-05-15
Stage: planning
Task: `V1SETTINGS-001`

## Purpose

This spec defines the canonical V1 direction for the private settings module.
Settings should become a simple configuration surface instead of a dense
dashboard, synchronization workbench, or provider-operation center.

The owner outcome is:

```text
I can paste the credentials needed to connect ClickUp, Google Drive, Jarvis,
Paperclip, and MCP without seeing import queues, sync tables, mapping debt, or
operational dashboards.
```

## Canonical Images

- Desktop target:
  `docs/ux/assets/companycore-v1-settings-desktop-canonical.png`
- Mobile target:
  `docs/ux/assets/companycore-v1-settings-mobile-canonical.png`
- Render source:
  `docs/ux/assets/companycore-v1-settings-canonical.html`

These images are planning targets for the next implementation slice. They are
not production proof until the React route is built and verified.

## Route Direction

The current route set should converge into one settings module:

- `/settings` should become the canonical settings entry route.
- `/settings/integrations`, `/settings/drive`, `/settings/api`, and
  `/react-agent-tools` should become section-aware entry points into the same
  simple settings module.
- Synchronization, import, mapping, verification, and review queues must move
  to dedicated work views. They must not be presented as settings.

## Information Architecture

Top-level settings sections:

| Section | Purpose |
| --- | --- |
| Integrations | Minimal credential forms for ClickUp and Google Drive. |
| Agent keys | Minimal API key creation for Jarvis, Paperclip, and future apps. |
| MCP | Copy/read the MCP manifest URL and local server command. |

## Layer Model

Settings should expose only the fields needed to connect:

- ClickUp: `API token`.
- Google Drive: `Client ID` and `Client secret`.
- Jarvis/Paperclip: `Agent`, `Access profile`, and generated API key.
- MCP: `Manifest URL` and local server command.

Detailed access review, tool catalogs, sync logs, and audit trails belong in
their own views, not in the first settings screen.

## What Settings Must Not Contain

Settings must not contain:

- provider dashboards;
- badges and decorative readiness counters;
- import progress;
- sync queues;
- folder or task mapping workbenches;
- relationship review tables;
- large MCP tool catalogs;
- operational metrics that belong to dashboard, area, task, knowledge, or
  sync views.

Settings may link to those views after a connection is configured.

## Desktop Layout

- Reuse the private V1 atlas shell and dark area sidebar.
- Use a compact top command bar with settings breadcrumb and search.
- Show one short title and one sentence.
- Use three simple tabs: Integrations, Agent keys, MCP.
- Use one vertical form per tool.
- Prefer one primary action per form.
- Use links to dedicated work views for imports, sync, mapping, task review,
  and MCP tool inspection.

## Mobile Layout

- Use the existing mobile private topbar pattern.
- Stack title, tabs, then the forms.
- Keep every form short enough to understand in one glance.
- Do not show dense tables or operational workbenches.
- No horizontal overflow.

## States

Every implemented tab must define:

- `loading`: local skeleton or notice for the selected tab only.
- `empty`: honest missing setup state with one next action.
- `error`: user-language recovery message, not raw backend/provider error.
- `success`: saved connection, updated default, or key-created confirmation
  near the action that produced it.
- `review`: scoped warnings for missing connection, broad key profile, or
  disabled approval gate.

## Quality Bar

- Settings should feel like a calm credential form, not an admin dump and not
  an operations dashboard.
- The first read must answer where to paste the API key, API secret, or client
  credentials.
- Provider setup must stay simple: save credentials only. Deep
  sync/import/mapping belongs elsewhere.
- Agent access must stay least-privilege and visibly guarded.
- No fake readiness metrics, placeholder integrations, invented provider data,
  or decorative counters may be shown in implementation.
