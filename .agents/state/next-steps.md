# Next Steps

Last updated: 2026-05-08

## NOW

1. No ready v1 runtime or agent-runtime task remains after CCV1-061,
   AGRUN-009, and AGRUN-008 were reconciled.

## NEXT

1. Product decision required: choose the next v2 product slice, an upstream
   source handoff route, or a release automation tooling investment.

## LATER

1. AGRUN-007 Google Drive Owner Consent And First Import, blocked until real
   OAuth credentials and owner consent are available.
2. AGRUN-010 Upstream Agent Source Merge Execution, blocked until upstream
   write access or an approved fork/PR route exists.

## Selection Rules

- Pick exactly one task for each autonomous iteration.
- Prefer tasks that reduce blocker risk, regression risk, or unclear source of
  truth.
- Do not start new feature work when a P0/P1 regression or release blocker is
  unresolved.
- Keep this file synchronized with `.codex/context/TASK_BOARD.md` and
  `docs/planning/mvp-next-commits.md`.
