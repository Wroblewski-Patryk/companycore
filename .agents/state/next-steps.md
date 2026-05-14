# Next Steps

Last updated: 2026-05-14

## NOW

1. ACF-UX-001 Mobile Overflow And Focus Accessibility Fix.
   - Fix mobile horizontal overflow on `/settings/api` and `/react-company-os`.
   - Reduce unnamed focusable controls in the vanilla owner shell.
   - Verify with production-like Playwright desktop/mobile checks.

## NEXT

1. ACF-SEC-001 Production Secret And CORS Hardening.
   - Add production required-secret validation.
   - Decide or restrict production CORS.
2. ACF-DOC-001 Coverage Ledger Reconciliation.
   - Refresh stale Drive import and finish-audit ledger rows.
3. ACF-PROD-001 Operating Model Data Completion Decision.
   - Decide whether projects, storage locations, knowledge roots, and
     automation definitions need production seed/import or accepted deferral.

## LATER

1. ACF-UX-002 Company City Dashboard Implementation Or Supersession.
2. ACF-MAINT-001 Large File Modularization.
3. ACF-OPS-001 Auto-Deploy Proof Or Manual Path Acceptance.
4. ACF-QA-001 Lint And Split Test Gates.
5. AGRUN-010 Upstream Agent Source Merge Execution, blocked until upstream
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
