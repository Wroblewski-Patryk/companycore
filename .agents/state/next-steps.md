# Next Steps

Last updated: 2026-05-14

## NOW

1. ACF-MAINT-001 Large File Modularization.
   - Split hotspots only after product/data decisions are no longer blocking
     owner-grade usefulness.

## NEXT

1. V2VIS-001 Shared CompanyShell And Dashboard Frame.
   - Start only when the user explicitly chooses to move from planning into V2
     visual implementation.

## LATER

1. ACF-UX-002 Company City Dashboard / Gamified Strategic Map.
   - Deferred to V2 readiness gate.
2. ACF-OPS-001 Auto-Deploy Proof Or Manual Path Acceptance.
3. ACF-QA-001 Lint And Split Test Gates.
4. AGRUN-010 Upstream Agent Source Merge Execution, blocked until upstream
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
