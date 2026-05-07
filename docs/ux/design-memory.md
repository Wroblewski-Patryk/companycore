# Design Memory

Purpose: keep a compact memory of approved visual directions, reusable UI
patterns, and verified UX learnings so future tasks can build on them instead
of rediscovering them.

## Update Rules

- Add or update an entry when a visual pattern, layout approach, or interaction
  rule has been approved in implementation or review.
- Prefer updating an existing entry over creating duplicates.
- Keep entries specific enough to reuse in future tasks.
- If a pattern is project-specific, say so explicitly.

## Entry Template

```markdown
### YYYY-MM-DD - Short Title
- Type: visual_direction | reusable_pattern | responsive_rule | ux_learning
- Context:
- Decision:
- Reuse when:
- Avoid when:
- Evidence:

### YYYY-MM-DD - Background Asset Fidelity Rule
- Type: ux_learning
- Context:
- Decision:
- Reuse when:
- Avoid when:
- Evidence:
```

## Entries

### 2026-05-07 - Workbench Index Rows
- Type: reusable_pattern
- Context: Data-heavy owner-console pages need clear operational lists for
  modules, API-backed records, provider sources, and future table workbenches.
- Decision: Reuse `workbench-panel`, `workbench-filter-bar`,
  `workbench-index-list`, `workbench-index-row`, `workbench-index-metrics`,
  `workbench-index-meta`, and `workbench-index-action` for dense index screens.
- Reuse when: A page needs searchable/filterable rows that combine a primary
  entity description, operational metrics, source/status metadata, and one
  route action.
- Avoid when: The user is editing one record in detail or comparing tabular
  cells where a real table is more scannable.
- Evidence: V2WEB-024 `/data` desktop and mobile Playwright smoke passed with
  13 module rows, filter interaction, and no browser console errors.

### 2026-05-07 - Agent Key Control Panel
- Type: reusable_pattern
- Context: Auth-sensitive owner-console actions need guided forms, copy-once
  secret handling, local status, and clear inactive states without exposing raw
  provider/backend errors.
- Decision: Use a two-column control panel with a scoped preset form on the
  left, one-time secret output on the right, and a row list below for current
  credentials and lifecycle actions.
- Reuse when: A settings screen creates sensitive credentials, webhooks, OAuth
  client material, or agent runtime tokens.
- Avoid when: The action is a simple non-secret toggle or a read-only status
  summary.
- Evidence: AGRUN-005 `/settings/api` browser smoke created a scoped key,
  displayed the raw key once, deactivated the key, and passed desktop/mobile
  visual checks without console errors.

### 2026-05-07 - Split Record Workbench
- Type: reusable_pattern
- Context: Operators need to inspect records from many CompanyCore tables
  before typed create/edit forms exist for every module.
- Decision: Use a split layout with a searchable record list on the left and a
  selected-record inspector on the right. Show concise record title/meta,
  readable field rows, and a collapsible raw JSON block for verification.
- Reuse when: A database, provider, or integration module needs fast read-only
  triage before a payload-specific editor is implemented.
- Avoid when: The task requires multi-row comparison, bulk actions, or typed
  editing controls; use a table or typed form pattern instead.
- Evidence: V2WEB-025 `/data/notes` browser smoke created a note through the
  API, filtered the table, and inspected the record on desktop/mobile.
