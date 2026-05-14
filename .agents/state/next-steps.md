# Next Steps

Last updated: 2026-05-14

## NOW

No local Company OS workflow recovery task is currently ready. The next active
work is external/target-environment validation listed under `LATER`, unless a
new product slice is selected.

## NEXT

V2WEB-AGENT-024 is complete. Workflow recovery has backend lineage, web
controls, clean collection fetches, mock UI proof, and real-backend UI proof
against a disposable Docker Compose stack.

## LATER

1. AGRUN-007 Google Drive Owner Consent And First Import, local patch verified;
   deploy the patched backend/web bundle, then rerun production folder
   discovery and first selected-folder import smoke with the connected owner
   account.
2. AGRUN-010 Upstream Agent Source Merge Execution, blocked until upstream
   write access or an approved fork/PR route exists.

## Selection Rules

- Pick one bounded mission objective for each autonomous iteration; use small
  checkpoint tasks inside that mission when useful.
- Prefer tasks that reduce blocker risk, regression risk, or unclear source of
  truth.
- Do not start new feature work when a P0/P1 regression or release blocker is
  unresolved.
- Keep this file synchronized with `.codex/context/TASK_BOARD.md` and
  `docs/planning/mvp-next-commits.md`.
