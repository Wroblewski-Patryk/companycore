# Next Steps

Last updated: 2026-05-08

## NOW

UXA-012 React Workbench Route Migration is ready. Migrate one high-value
workbench route into React using the approved dashboard, table, and
local-notification primitives while preserving vanilla fallback routes.

## NEXT

After UXA-012, decide whether to point the canonical route at the React
workbench or keep it as a parallel preview until one more route proves parity.

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
