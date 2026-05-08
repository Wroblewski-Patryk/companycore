# Next Steps

Last updated: 2026-05-08

## NOW

UXA-009 React Tailwind DaisyUI Migration Foundation is ready. Introduce an
explicit React + Vite + Tailwind + DaisyUI frontend foundation as a reversible
architecture slice while preserving backend APIs, auth, deployment shape, and
owner-console flows.

## NEXT

After UXA-009, migrate the highest-value dashboard surface into reusable
components: app shell, command panel, attention rows, module launcher,
notifications, and table foundation.

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
