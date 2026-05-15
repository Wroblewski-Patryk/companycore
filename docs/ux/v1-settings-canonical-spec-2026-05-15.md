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
I can connect CompanyCore to the tools I use, create safe access for Jarvis and
Paperclip, and understand where to change each setting without seeing import
queues, sync tables, mapping debt, or operational dashboards.
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
| General | Workspace identity, default area, language, owner-safe defaults. |
| Connections | Save and edit provider connection settings for Google Drive and ClickUp. |
| Agent access | Create and manage scoped keys for Jarvis, Paperclip, and future apps. |
| MCP | Show the endpoint, manifest status, and high-level tool safety posture. |

## Layer Model

Settings should expose AI configuration through two plain ideas:

- `Knowledge access`: which connected sources the agent can use.
- `Tool access`: which CompanyCore actions the agent can call.

Two supporting ideas stay visible but quiet:

- `Profile`: reader, operator, or supervised access.
- `Approval`: write/destructive actions stay owner-approved by default.

Detailed audit trails belong in an audit or activity view, not in the first
settings screen.

## What Settings Must Not Contain

Settings must not contain:

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
- Show a short settings intro that states the rule:
  settings are for configuration only.
- Use four simple section cards: General, Connections, Agent access, MCP.
- Use a two-column body on desktop:
  - left: section list and status;
  - right: the selected section's small set of controls.
- Prefer one primary action per card.
- Use links to dedicated work views for imports, sync, mapping, task review,
  and MCP tool inspection.

## Mobile Layout

- Use the existing mobile private topbar pattern.
- Stack intro, horizontal section cards, section list, then the selected
  controls.
- Keep sections horizontally scrollable when needed.
- Keep every setting card short enough to read in one phone viewport.
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

- Settings should feel like a calm configuration room, not an admin dump and
  not an operations dashboard.
- The first read must answer where to change workspace defaults, provider
  connections, agent keys, and MCP endpoint settings.
- Provider setup must stay simple: save connection and choose basic scope.
  Deep sync/import/mapping belongs elsewhere.
- Agent access must stay least-privilege and visibly guarded.
- No fake readiness metrics, placeholder integrations, invented provider data,
  or decorative counters may be shown in implementation.
