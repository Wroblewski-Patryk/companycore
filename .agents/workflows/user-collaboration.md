# User Collaboration Workflow

## Objective

Keep agent work aligned with the user's intent while preserving momentum,
truthfulness, and small reversible steps.

## Default Collaboration Loop

1. Restate the concrete target when the request has ambiguity.
2. Identify the active source of truth: task board, planning doc, design
   reference, production evidence, or direct user instruction.
3. Make reasonable assumptions when the risk is low and record them in the
   task or final report.
4. Stop for a user decision when assumptions would change architecture,
   product direction, data safety, deployment risk, or canonical visual intent.
5. Deliver one useful slice before expanding scope.
6. Report what changed, what was validated, what remains uncertain, and the
   next tiny task.

## Continue Intent

When the user says `pracuj dalej`, `rob dalej`, `kontynuuj`, `next`, `go`, or a
similar short execution nudge:

- treat it as permission to continue toward the already documented target, not
  as permission to invent unrelated work
- read the project state, task board, next-steps file, planning queue, and
  module confidence ledgers before selecting work
- if a coherent mission is already defined, continue the next checkpoint rather
  than shrinking to a random tiny slice
- for broad work, refresh `.agents/state/active-mission.md` before editing so
  the current objective, lanes, owners, proof, and stop conditions are visible
- if the work is broad and separable, use the coordinator/subagent workflow to
  assign bounded lanes such as analysis, implementation, QA, security, UX,
  docs, ops, or release review
- if no legitimate next task can be derived from repository state, say that
  plainly and create or request the smallest planning step needed to unblock
  progress

## User Working Style

The user prefers candid, strategic collaboration with enough structure to keep
large projects moving. Agents should optimize for:

- direct truth over reassurance
- clear hierarchy: goal, current state, blockers, next mission, proof
- proactive continuation when source-of-truth files define the target
- explicit uncertainty instead of vague optimism
- concise but high-signal reports
- preserving context in repository memory so future agents can continue without
  hidden chat context

Do not store or rely on psychological labels when operational preferences are
enough. Use the preferences above as collaboration guidance.

## Decision Points

Ask before continuing when:

- two approved sources of truth conflict
- user notes conflict with a canonical screenshot or previously approved
  interpretation
- the proper implementation requires architecture or design-system changes
- the available evidence is not enough to safely choose between product
  behaviors
- a shortcut would introduce placeholder, mock-only, temporary, or
  workaround-only behavior

## Evidence Habit

Every meaningful answer after implementation should make the work auditable:

- changed files or docs
- checks actually run
- browser or screenshot evidence for UI work
- smoke or rollback notes for runtime/deployment work
- explicit residual risks
- next tiny task

## Tone And Language

- Communicate with the user in the user's language.
- Keep repository artifacts in English.
- Be concise, concrete, and candid about uncertainty.
- Do not bury blockers. Name the blocker and the smallest decision or evidence
  needed to unblock it.
