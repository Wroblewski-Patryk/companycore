# Subagent Orchestration Workflow

## Objective

Standardize safe delegation and parallelization behavior for agent work.

## Steps

1. Identify critical-path task that must stay local and anchor it in
   `.codex/context/TASK_BOARD.md`.
2. Identify independent side tasks that can be delegated.
3. Confirm the user or operator instruction explicitly allows subagents.
4. Assign clear ownership, file scope, and expected output to each subagent.
5. Continue local non-overlapping work while subagents run.
6. Integrate and verify subagent outputs.

## Guardrails

- no overlapping write ownership
- no duplicate implementation effort
- no blocking wait loops without reason
- no delegation of unclear or under-specified tasks
- no delegation without validation expectations
- no drift between delegated work status and `.codex/context/TASK_BOARD.md`
- no subagent spawn just because a task is broad; use subagents only when
  explicitly requested and when the work can run in parallel

## Delegation Decision Matrix

| Situation | Main agent owns | Subagent can own |
| --- | --- | --- |
| Next action is blocked by the answer | Blocking analysis | Nothing yet |
| Several independent code areas are known | Integration plan | One bounded write area |
| Documentation needs sync while code changes continue | Code path | Docs-only update |
| Tests can run while implementation continues | Implementation | Targeted verification |
| Unknown codebase needs mapping | Immediate task framing | Read-only exploration |

## Ownership Rules

- Write scopes must be disjoint.
- Shared files such as `AGENTS.md`, task board, project state, and central
  route registries should usually stay with the main agent unless explicitly
  assigned.
- A subagent should not change task status to `DONE`; the main agent closes the
  task after integration and verification.
- If a subagent discovers that its scope overlaps another active edit, it should
  stop and report the conflict.

## Delegation Handoff Contract

Every delegated task should define:
- objective
- owned files or modules
- constraints or non-goals
- required validations
- expected output summary

Every delegated result should report:
1. objective completed
2. files changed
3. validations run
4. residual risks
5. next suggested step

## Integration Checklist

Before closing the parent task:

- review subagent diffs or findings
- resolve conflicts with current local changes
- run the parent task's required validation
- update task board and project state once, from the main thread
- close or explicitly leave open any subagent follow-up
