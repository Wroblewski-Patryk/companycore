# Delivery Map

Last updated: 2026-05-14

## Current Product Target

- Product: companycore
- Current release or milestone: application completion audit complete; V2
  agent command guard checkpoint verified
- Primary user: owner/operator and policy-bound AI agents
- Primary outcome: CompanyCore becomes a production-quality human and agent
  Company OS control plane, with current audit findings driving the finish
  queue before new broad feature lanes are opened.
- Top blockers: operating-model data completeness and the unimplemented or
  unsuperseded Company City dashboard direction.
- Next mission: execute ACF-PROD-001 to decide whether production projects,
  storage locations, knowledge roots, and automation definitions need seed or
  import work, or an explicit accepted deferral.
- Closure handoff: `docs/operations/application-completion-audit-2026-05-14.md`.

## Source Inputs

| ID | Type | Source | What it defines | Status |
| --- | --- | --- | --- | --- |
| SRC-001 | architecture | `docs/architecture/` | Canonical system architecture | active |
| SRC-002 | API/data | `docs/API.md`, `docs/DATABASE.md` | HTTP and persistence contracts | active |
| SRC-003 | UX | `docs/ux/` | Interface and quality rules | active |
| SRC-004 | release control | `docs/planning/v1-architecture-control-map.md`, `docs/operations/v1-project-control-system.md` | V1 boundary, external blockers, and post-V1 lane options | active |
| SRC-005 | evidence | `docs/operations/v1-function-coverage-ledger.csv`, `.agents/state/module-confidence-ledger.md` | Verified V1 local evidence and remaining target proof notes | active |

## Module / Journey Map

| ID | Module | Journey or screen | Layers needed | Current state | Evidence | Next mission |
| --- | --- | --- | --- | --- | --- | --- |
| CCORE-DM-001 | V1 release confidence | Local architecture-derived V1 closure | docs, API, DB, scripts, tests | verified | V1EVID-001 trace `v1evid-1778458446081`; V1EVID-002 trace `v1evid-om-1778459014284`; task board marks no active local V1 evidence tasks | Keep external blockers visible; do not reopen runtime scope without a fresh defect. |
| CCORE-DM-002 | Agent-First Company OS | MCP and HTTP command coverage for policy-bound agents | MCP bridge, HTTP API, auth capabilities, events, audit, docs | verified through first queue UI slice | `docs/planning/v1-architecture-control-map.md` Lane A; MCP-001..MCP-006; V1EVID-001 Company OS lifecycle evidence; V2AGENT-001 audit; V2AGENT-002 least-privilege fix; V2AGENT-003 approval-aware design; V2AGENT-004 bridge guard; V2AGENT-005 supervised operator smoke; V2AGENT-006/V2AGENT-006R agent command queue UI and render proof | Select the next V2 slice only after adding a fresh task contract to the canonical queue. |
| CCORE-DM-003 | Operational Cockpit | Human owner cockpit for approvals, blocked work, automation evidence, MCP tool visibility, operating areas, graph relationships, command consequences, and controlled definition editing | React UI, route kit, API, auth, MCP manifest, UX evidence | verified through workflow recovery controls, workflow lineage, and collection fetch alignment | Company OS cockpit and React `/areas` are implemented; V2AGENT-006/R verified the first command queue UI; `docs/planning/human-agent-web-architecture-map.md` maps the human-agent web direction; V2WEB-AGENT-001 verified `/react-agent-tools`; V2WEB-AGENT-002 verified Company OS correlation timeline; V2WEB-AGENT-003 verified operating graph detail; V2WEB-AGENT-004 verified command preview; V2WEB-AGENT-005 added `docs/architecture/company-os-definition-editing-contract.md`; V2WEB-AGENT-006 added audited `standards` backend write routes and MCP exposure; V2WEB-AGENT-007/007R added and verified the standards web editor; V2WEB-AGENT-008 added workflow definition command contract; V2WEB-AGENT-009 added audited workflow draft/update/impact-preview backend routes; V2WEB-AGENT-010 added approval-aware procedure activation; V2WEB-AGENT-011 added process/pipeline versioning and activation; V2WEB-AGENT-012 added and verified guarded workflow draft create/preview/activation UI; V2WEB-AGENT-013 selected draft history/readback before archive/rollback; V2WEB-AGENT-014 added and verified draft list/detail/resume; V2WEB-AGENT-015 selected phased archive/rollback recovery commands; V2WEB-AGENT-016 added and verified inactive historical-version archive; V2WEB-AGENT-017 added and verified rollback-draft creation; V2WEB-AGENT-018/019 added and verified web recovery controls; V2WEB-AGENT-020/021 added explicit workflow root lineage and verified renamed pipeline rollback; V2WEB-AGENT-022 fixed Company OS collection fetch paths with clean render proof. | Prove recovery activation end to end in V2WEB-AGENT-023. |
| CCORE-DM-004 | Provider Adapter Expansion | Google Drive and future providers through ToolAdapter and IntegrationCapability | provider APIs, OAuth, API, DB, owner UI, ops | partially verified / candidate | Google Drive foundation and AGRUN-007 owner consent/import are verified in production; future provider work remains candidate scope | Improve Drive freshness/content-quality proof or select a new provider task only after current ACF P1 blockers are closed or explicitly deferred. |
| CCORE-DM-005 | Data Quality And Coverage | Keep coverage ledgers, code-surface index, and queues current | docs, ledger, tests, smokes | verified for current V1 pass | V1CTRL-001, V1CTRL-002, V1EVID-001, V1EVID-002 | Maintain during each future V2 slice rather than creating a separate feature lane. |
| CCORE-DM-006 | Application Completion Finish Queue | Audit-derived finish work across UX, security, data completeness, docs, maintainability, and deployment proof | docs, UI, API, config, tests, production smokes | in progress | `docs/operations/application-completion-audit-2026-05-14.md`; `docs/planning/application-completion-audit-task-contract.md`; ACF-UX-001 closure evidence; ACF-SEC-001 closure evidence; ACF-DOC-001 reconciliation evidence | ACF-UX-001, ACF-SEC-001, and ACF-DOC-001 are verified; execute ACF-PROD-001 before lower-priority polish or broad new features. |

## Visual Slice Map

| ID | Reference | Screen / zone | Components | States | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CCORE-VIS-001 | `docs/ux/design-system-contract.md`; `docs/ux/design-memory.md` | Company OS cockpit and canonical `/areas` | React route kit shell, metrics, tables, local notices, lifecycle controls | loading, empty, error, success, blocked | implemented/verified locally | System health UXA-009..UXA-030 entries. |
| CCORE-VIS-002 | V2 lane decision | Agent-first command and approval queues | To be defined after MCP profile hardening and command-flow design | loading, empty, error, success, blocked | planned | No UI work selected yet; must reuse existing React route-kit patterns. |
| CCORE-VIS-003 | `docs/ux/authenticated-shell-layout-audit-2026-05-14.md`; `docs/ux/company-city-dashboard-v3-spec.md` | Authenticated web shell and Company City dashboard | CompanyShell, CompanySidebar, TopCommandBar, CommandBriefPanel, CompanyAreaSwitcher, StatusStrip, CompanyCityCanvas | signed out, loading, ready, degraded, blocked, mobile drawer, tablet rail, desktop persistent shell | planned | ACF-UX-002 planning audit recorded current vanilla/React shell divergence and the canonical responsive shell contract. |
