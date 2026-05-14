# Regression Log

Last updated: 2026-05-09

## Active Regressions

| ID | Severity | Surface | Detected by | Symptom | Canonical contract | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REG-001 | P2 | Agent workflow state | Manual source-of-truth audit | `.agents/state/*` contained placeholders after v1 closure, making continuation ambiguous. | `.agents/core/operating-system.md` | FIXED | Keep state files synchronized after each iteration. |

## Fixed Regressions

- 2026-05-08: Replaced placeholder agent state with current v1 post-release
  focus, known blockers, health snapshot, and next-step queue.

## Monitoring

- Monitor future deploys: do not claim reliable auto-deploy until a
  push-to-running-image smoke is recorded in `docs/operations/post-deploy-smoke.md`.
- Monitor future Company OS lifecycle slices: stage writes are now available
  only as command routes with approval, acceptance criteria, event, and audit
  checks; do not add raw `stage_runs` or `pipeline_runs` status patching.
- Monitor future automation slices: automation rules must observe normalized
  events and call approval/lifecycle command paths; do not add provider-direct
  calls, arbitrary script execution, or duplicate approval/stage transitions.
