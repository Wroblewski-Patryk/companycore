# Current Focus

Last updated: 2026-05-08

## Active Focus

CompanyCore v1 runtime is accepted and live for the approved owner, ClickUp,
Jarvis, Paperclip, workspace API, and agent CRUD scope. The current focus is
keeping the v1 handoff clean after closing source-of-truth drift around agent
state, release automation evidence, and route-level editing coverage. No ready
v1 runtime or agent-runtime task remains in the canonical queue.

## Current System Objective

Optimize for source-of-truth clarity, no regression, and a deliberate
transition into the next approved v2 product slice or external operations
handoff.

## Current Delivery Stage

Post-release. V1 operator handoff is documented in
`docs/operations/v1-operator-handoff.md`; release readiness is documented in
`docs/operations/v1-release-readiness.md`; all P0/P1 v1 runtime tasks are done
or blocked on external owner/provider action. CCV1-061, AGRUN-009, and AGRUN-008
closed the remaining continuation-state, deploy-evidence, and editing-surface
documentation drift.

## Current Priority Order

1. Stability
2. Architecture alignment
3. No regressions
4. Correct flows
5. UX quality
6. Visual polish
7. New features

## Active Constraints

- Do not touch unrelated in-progress code changes.
- Keep source-of-truth docs in English.
- Reuse existing `.codex/context`, planning, governance, and architecture
  systems.
- Do not mark Google Drive owner consent/import complete until real OAuth
  credentials, owner consent, and target-environment import evidence exist.
- Do not mark upstream Paperclip/OpenJarvis merge execution complete until
  write access or an approved fork/PR route exists.
- Treat GitHub-to-Coolify auto-deploy as a P2 release-automation evidence item,
  not as a v1 runtime blocker.
