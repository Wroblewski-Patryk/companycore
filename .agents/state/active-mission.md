# Active Mission Packet

Last updated: YYYY-MM-DD

Use this file as the first operational router for `pracuj dalej`, `rob dalej`,
`kontynuuj`, `next`, and similar continuation nudges. Keep it short enough that
a fresh coordinator can choose the next checkpoint without rereading the whole
repository history.

## Current Mission

- Mission ID:
- Status: PLANNED | IN_PROGRESS | CHECKPOINTED | VERIFIED | PARTIALLY_VERIFIED | BLOCKED | FAILED | SUPERSEDED
- Selected objective:
- Why this mission now:
- Release objective or product milestone advanced:
- First/next checkpoint:
- Stop conditions:
- Parent validation gate:

## Source Rows

- Task board:
- Planning:
- Delivery map:
- Requirements:
- Quality scenarios:
- Risks:
- Module confidence:
- System health:
- Architecture / UX / security / ops sources:

## Responsibility Lanes

| Lane | Owner | Source docs/state | Owned files/surfaces | Output | Validation/proof | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Coordinator | Active chat | AGENTS, state, docs | Integration, task closure, source-of-truth updates | Mission packet, lane briefs, final acceptance | Parent validation gate | PLANNED |
| Product/Requirements | Product Docs or coordinator | Product docs, requirements matrix | Requirements and acceptance criteria | Confirmed scope and success signal | Requirement rows updated | PLANNED |
| Architecture | Architect or coordinator | Architecture docs, ADRs | Architecture constraints and contracts | Alignment or mismatch note | Architecture evidence | PLANNED |
| Implementation | Builder lane(s) | Code, task contract | Assigned files only | Scoped implementation | Build/tests for owned scope | PLANNED |
| QA/Test | QA/Test | Task, code, risk rows | Validation surfaces | Test and proof report | Commands, smoke, journey proof | PLANNED |
| Security/Ops/UX | Specialist lane(s) as needed | Security, ops, UX docs | Assigned review surfaces | Findings and gates | Focused proof or explicit N/A | PLANNED |
| Documentation/Memory | Coordinator or docs lane | State files and docs | Task board, project state, ledgers, learning | Durable memory update | Source-of-truth diff | PLANNED |

## Delegation Plan

- Lanes kept local:
- Lanes delegated:
- Lanes intentionally omitted and why:
- Known overlap risks:
- Forbidden files or surfaces:

## Acceptance

- [ ] Every important responsibility from source docs has an owner or explicit omission.
- [ ] No two write lanes own the same file or shared registry.
- [ ] Each lane has expected output and validation/proof.
- [ ] Parent validation will run after accepted lane integration.
- [ ] Missing or unclear ownership will be recorded in `.agents/state/responsibility-learning.md`.
- [ ] Process quality will be evaluated in `.agents/state/agent-evals.md` when
      this mission is broad, repeated, partial, or subagent-heavy.

## Checkpoint Log

| Date | Checkpoint | Result | Evidence | Next action |
| --- | --- | --- | --- | --- |
