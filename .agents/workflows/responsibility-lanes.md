# Responsibility Lanes

## Purpose

Use this catalog when a coordinator turns docs, plans, screenshots, references,
or state files into active work. A lane is a responsibility with an owner,
inputs, output, validation, and memory destination.

## Standard Software Lanes

| Lane | Default owner | Inputs | Output | Validation | Memory target |
| --- | --- | --- | --- | --- | --- |
| Coordinator | Active chat | AGENTS, operating system, state files, task board | Mission packet, lane briefs, integration decision | Parent completion gate | Active mission, task board, project state |
| Product/Requirements | Product Docs or coordinator | Product docs, requirements matrix, user feedback | Scope, acceptance criteria, success signal | Requirement rows trace to evidence | Requirements matrix, decision register |
| Architecture | Architect or coordinator | Architecture docs, ADRs, module docs | Constraints, mismatch report, approved path | Code/docs alignment | Architecture docs, open decisions |
| Backend/API | Backend Builder | Backend code, API contracts, tests | Scoped implementation or findings | Unit/integration/API proof | Module confidence, task evidence |
| Frontend/UX | Frontend Builder / UX | UX docs, screenshots, routes, components | UI implementation or UX findings | Browser/responsive/a11y proof | Design memory, module confidence |
| Data/Migrations | DB/Migrations | Schema, migrations, seed data | Data change or migration plan | Migration/test proof | Architecture/data docs |
| QA/Test | QA/Test | Task, code, risk rows | Verification report and gaps | Commands, smoke, journey proof | System health, module confidence |
| Security | Security | Security docs, auth, permissions, secrets | Risk findings and fail-closed checks | Focused security proof | Risk register, security docs |
| Ops/Release | Ops/Release | Deploy docs, env, smoke, rollback | Release readiness and rollback notes | Build/smoke/health proof | Operations docs, system health |
| Documentation/Memory | Documentation Agent or coordinator | Changed truth and evidence | Source-of-truth updates | Links resolve and state agrees | Docs, learning journal, active mission |

## Lane Selection Rules

- Create a lane for every important responsibility named by source docs.
- Keep the critical path, shared state updates, and final acceptance with the
  coordinator.
- Delegate only lanes with separable scope and clear validation.
- Mark a lane `intentionally omitted` when it does not apply, and explain why.
- If no lane owns an important responsibility, record `missing_lane` in
  `.agents/state/responsibility-learning.md`.
- If two lanes would edit the same file, split by responsibility differently or
  keep the work local.

## Lane Brief Template

```md
## Lane Brief

- Lane:
- Owner:
- Objective:
- Source docs/state:
- Owned files or surfaces:
- Forbidden files or surfaces:
- Expected output:
- Required validation/proof:
- Missing responsibility noticed? yes | no
- Report format:
```

## Lane Report Template

```md
## Lane Report

- Lane:
- Objective completed or blocked:
- Files changed or read-only confirmation:
- Validation/proof:
- Findings:
- Residual risks:
- Missing responsibility noticed? yes | no
- Suggested next step:
```
