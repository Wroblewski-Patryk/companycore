# Subagent Orchestration Workflow

## Objective

Standardize coordinator-led delegation so parallel work improves delivery
without weakening integration, project memory, or the definition of done.

## Coordinator Loop

1. Identify the critical-path task that must stay local and anchor it in
   `.codex/context/TASK_BOARD.md`.
2. Identify independent side tasks that can be delegated without overlapping
   write ownership.
3. Review `.agents/workflows/responsibility-lanes.md`.
4. Draft a subagent brief with objective, owned files or modules, non-goals,
   validation, and expected report.
5. Continue local non-overlapping work while subagents run.
6. Review subagent findings or diffs before accepting them.
7. Integrate accepted work and reject or track unsafe work.
8. Run parent-level validation after integration.
9. Update source-of-truth state once from the coordinator thread.
10. Close the parent task only when every required delegated lane is resolved.

## Guardrails

- no overlapping write ownership
- no duplicate implementation effort
- no blocking wait loops without reason
- no delegation of unclear or under-specified tasks
- no delegation without validation expectations
- no drift between delegated work status and `.codex/context/TASK_BOARD.md`
- no subagent spawn just because a task is broad; delegate only when the work
  can run independently and integration has a clear owner
- no parent `DONE` state until required subagent results are integrated,
  rejected, or converted into follow-up tasks

## Delegation Decision Matrix

| Situation | Coordinator owns | Subagent can own |
| --- | --- | --- |
| Next action is blocked by the answer | Blocking analysis | Nothing yet |
| Several independent code areas are known | Integration plan and final validation | One bounded write area |
| Documentation needs sync while code changes continue | Code path and final source-of-truth update | Docs-only update in assigned files |
| Tests can run while implementation continues | Implementation and acceptance decision | Targeted verification |
| Unknown codebase needs mapping | Immediate task framing | Read-only exploration |
| Security, AI, auth, money, or deploy risk exists | Risk decision and closure gate | Targeted adversarial or release review |

## Ownership Rules

- Write scopes must be disjoint.
- Shared files such as `AGENTS.md`, task board, project state, and central
  route registries should usually stay with the coordinator unless explicitly
  assigned.
- A subagent should not change task status to `DONE`; the coordinator closes the
  task after integration and verification.
- If a subagent discovers that its scope overlaps another active edit, it should
  stop and report the conflict.
- If subagent work changes reusable knowledge, the coordinator decides where to
  persist that learning.

## Delegation Handoff Contract

Every delegated task should define:

- objective
- owned files, modules, or read-only responsibility
- constraints, non-goals, and forbidden files
- known active parallel work, if any
- required validations
- expected output summary

Every delegated result should report:

1. objective completed or blocked
2. files changed, or confirmation that the task was read-only
3. validations run
4. findings, residual risks, and uncertainty
5. next suggested step

## Integration Checklist

Before closing the parent task:

- review subagent diffs or findings
- resolve conflicts with current local changes
- decide whether each subagent output is accepted, rejected, or tracked
- run the parent task's required validation
- if a subagent reports a missing responsibility, unclear ownership, or a lane
  that should have existed, update the mission plan and persist that learning
  before the next similar mission
- update task board, project state, module confidence, and learning journal
  once from the coordinator thread when applicable
- close or explicitly leave open any subagent follow-up

## Responsibility Learning Loop

When delegated work exposes a gap in the mission structure, the coordinator
must classify it before closing:

- `missing_lane`: a needed responsibility was not assigned to any agent
- `unclear_owner`: multiple lanes assumed someone else owned the work
- `bad_split`: delegated lanes overlapped or could not be integrated cleanly
- `missing_evidence`: a lane delivered output without the proof needed for
  acceptance
- `missing_context`: a lane lacked the source-of-truth context needed to act

For each gap, record:

1. what responsibility was missing
2. which source files or evidence revealed it
3. how the next similar mission should brief or split agents differently
4. where the durable learning was stored

Store durable learning in `.codex/context/LEARNING_JOURNAL.md`,
`.agents/state/known-issues.md`, `.agents/state/next-steps.md`, the task board,
or the relevant architecture, operations, security, UX, planning, or release
doc.
