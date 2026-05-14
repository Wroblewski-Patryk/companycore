# Delivery Map

Last updated: 2026-05-14

## Current Product Target

- Product: companycore
- Current release or milestone: local V1 evidence complete; V2 agent command
  guard checkpoint verified
- Primary user: owner/operator and policy-bound AI agents
- Primary outcome: CompanyCore remains the audited Company OS control plane,
  with V2 work opened only through one deliberate lane after V1 local evidence
  closure.
- Top blockers: Google Drive owner consent/import, upstream source merge
  permissions, and GitHub-to-Coolify auto-deploy proof are external blockers,
  not local V1 implementation gaps.
- Next mission: prove rollback-draft preview, approval, and activation end to
  end from the owner cockpit after V2WEB-AGENT-020/021 closed renamed-version
  rollback and V2WEB-AGENT-022 fixed generic Company OS collection fetches.
- Closure handoff: `docs/operations/v1-achievement-and-blocker-handoff.md`.

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
| CCORE-DM-004 | Provider Adapter Expansion | Google Drive and future providers through ToolAdapter and IntegrationCapability | provider APIs, OAuth, API, DB, owner UI, ops | blocked/candidate | Drive foundation exists; AGRUN-007 is blocked by real OAuth credentials and owner consent | Resume only when credentials and consent exist, or select a non-credentialed provider design task. |
| CCORE-DM-005 | Data Quality And Coverage | Keep coverage ledgers, code-surface index, and queues current | docs, ledger, tests, smokes | verified for current V1 pass | V1CTRL-001, V1CTRL-002, V1EVID-001, V1EVID-002 | Maintain during each future V2 slice rather than creating a separate feature lane. |

## Visual Slice Map

| ID | Reference | Screen / zone | Components | States | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CCORE-VIS-001 | `docs/ux/design-system-contract.md`; `docs/ux/design-memory.md` | Company OS cockpit and canonical `/areas` | React route kit shell, metrics, tables, local notices, lifecycle controls | loading, empty, error, success, blocked | implemented/verified locally | System health UXA-009..UXA-030 entries. |
| CCORE-VIS-002 | V2 lane decision | Agent-first command and approval queues | To be defined after MCP profile hardening and command-flow design | loading, empty, error, success, blocked | planned | No UI work selected yet; must reuse existing React route-kit patterns. |
