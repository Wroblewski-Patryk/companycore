# Agent Operating System

Last updated: YYYY-MM-DD

## Purpose

This file defines the durable operating system for AI agents working in this
project. It does not replace `AGENTS.md`, `.codex/context/*`, or architecture
docs. It gives every future "continue", "rob dalej", "kontynuuj", or "next"
run a stable startup path, decision model, reporting model, and state update
model.

## Startup Protocol

For non-trivial work, read this order:

1. `AGENTS.md`
2. `.agents/core/operating-system.md`
3. `.agents/core/project-memory-index.md`
4. `.agents/core/mission-control.md`
5. `.agents/core/product-delivery-system.md`
6. `.agents/core/product-intake-and-decision-handshake.md`
7. `.agents/core/requirements-verification-system.md`
8. `.agents/core/execution-loop.md`
9. `.agents/core/anti-regression.md`
10. `.agents/core/quality-gates.md`
11. `.agents/state/current-focus.md`
12. `.agents/state/known-issues.md`
13. `.agents/state/module-confidence-ledger.md`
14. `.agents/state/delivery-map.md`
15. `.agents/state/decision-register.md`
16. `.agents/state/requirements-verification-matrix.md`
17. `.agents/state/quality-attribute-scenarios.md`
18. `.agents/state/risk-register.md`
19. `.agents/state/regression-log.md`
20. `.agents/state/system-health.md`
21. `.agents/state/next-steps.md`
22. `.codex/context/PROJECT_STATE.md`
23. `.codex/context/TASK_BOARD.md`
24. `.codex/context/LEARNING_JOURNAL.md`
25. `docs/planning/mvp-next-commits.md`
26. `docs/planning/mvp-execution-plan.md`
27. `docs/planning/open-decisions.md`

If these sources drift, canonical priority is:

1. `docs/architecture/`
2. product, security, and safety contracts
3. `.codex/context/*`
4. `.agents/state/*`
5. planning files
6. historical reports and archived notes

## Operating Principles

- Work in bounded, reversible, evidence-backed missions with checkpointed
  slices.
- Choose exactly one mission objective per autonomous run.
- Prefer stability, architecture alignment, no regressions, correct flows, UX,
  aesthetics, and only then new features.
- Reuse approved systems before creating or changing patterns.
- Treat architecture mismatches as decision points, not implementation puzzles.
- Select mission checkpoints from the full project picture. Use
  `.agents/core/project-memory-index.md`, `.agents/core/mission-control.md`,
  and `.agents/state/module-confidence-ledger.md` to identify the highest-value
  confidence gap.
- Use `.agents/core/product-delivery-system.md` and
  `.agents/state/delivery-map.md` to translate ideas, architecture,
  references, screenshots, and notes into cross-layer build slices before
  implementation.
- Use `.agents/core/product-intake-and-decision-handshake.md` and
  `.agents/state/decision-register.md` when intent, assumptions, product
  rules, UX direction, data, integrations, or validation are unclear.
- Use `.agents/core/requirements-verification-system.md` to connect
  requirements, quality scenarios, risks, code, validation, and evidence before
  reporting progress.
- Never introduce temporary bypasses, fake data, mock-only product behavior, or
  hidden fallback paths.
- For auth-sensitive, AI, secrets, payments, permissions, integrations,
  production, or user-data surfaces, default to fail-closed behavior and
  stronger validation.
- Clean up local validation resources before ending a task. Browser-driven
  checks must close Playwright/browser MCP pages, contexts, browsers, and local
  preview servers. Do not leave validation-owned `chrome-headless-shell`,
  `chromium`, Playwright, dev-server, Docker, or database processes running
  unless the user explicitly asked to keep them alive.
- Keep repository artifacts in English and user-facing conversation in the
  user's language.

## Continuation Semantics

When the user sends a short execution nudge, the agent must:

1. Refresh the state files in `.agents/state/`, especially requirements,
   quality scenarios, risk register, delivery map, and module confidence.
2. Cross-check `.codex/context/TASK_BOARD.md` and
   `docs/planning/mvp-next-commits.md`.
3. Pick the first executable `READY` or `IN_PROGRESS` task in the active queue,
   preferring failed, blocked, unverified, or release-critical requirements.
4. If no active task exists, derive the smallest safe task from
   `.agents/state/next-steps.md`, `docs/planning/mvp-execution-plan.md`, or
   `docs/planning/open-decisions.md`.
5. Write or update one task contract from `.codex/templates/task-template.md`.
6. Execute one iteration through `.agents/core/execution-loop.md`.
7. Update `.agents/state/*`, `.codex/context/*`, and relevant docs before
   reporting completion.

Do not rely on hidden chat memory to continue work. Future agents must be able
to recover from repository files alone.

## Knowledge Bootstrap Rule

If required state files, tables, ledgers, or planning docs are missing, empty,
stale, or still contain template/sample rows, the agent must not stop by
default. First rebuild the minimum useful project picture from repository
sources, then continue.

Bootstrap from these sources in order:

1. `docs/architecture/`, product specs, UX references, security contracts, and
   deployment contracts.
2. `.codex/context/*`, `.agents/state/*`, task boards, reports, and accepted
   user feedback.
3. Existing code, tests, routes, schemas, migrations, scripts, and runtime
   configuration.
4. Historical planning docs, handoffs, audits, and archived notes when active
   sources do not answer the question.

During bootstrap:

- create missing state files from existing templates when the project has no
  active version yet;
- replace sample rows with project-specific rows;
- mark every inferred row with a concrete source path or `inferred from code`;
- classify assumptions as `safe`, `risky`, or `blocking` in the decision
  register or task artifact;
- use `accepted` only for requirements backed by explicit product,
  architecture, or user-approved sources;
- use `implemented_not_verified` when code exists but proof is missing;
- use `proposed` for plausible requirements inferred from code or old notes
  without clear approval;
- ask the user only when the missing information would change product
  direction, data safety, deployment risk, payments, AI authority, permissions,
  or canonical UX intent.

For a new app or new major product surface, create the baseline blueprint,
delivery map, requirement matrix, quality scenarios, risk register, task board,
and next-step file before implementation, then fill them progressively as
decisions become clear.

## Project Analysis Model

Every autonomous iteration should classify the project through these lenses:

- architecture: source-of-truth alignment, ownership, data flow, safety
- backend: modules, services, persistence, workers, invariants
- API: routes, contracts, auth, validation, client compatibility
- frontend: route ownership, data fetching, state, i18n, rendering
- state management: source of truth, cache semantics, stale-state risks
- UI/UX: hierarchy, spacing, loading, empty, error, success, accessibility
- mobile readiness: responsive layout, touch, overflow, keyboard path
- regressions: behavioral drift, test gaps, duplication, dead code, type safety
- operations: health, readiness, smoke, rollback, observability
- documentation: architecture memory, module docs, planning, evidence

## Reporting Model

Every completion report must include:

- selected task and operation mode
- mission status and checkpoint
- files changed
- validation actually run
- validation not run and why
- module confidence rows changed
- deployment impact
- residual risk
- next tiny task

For review work, findings must lead the response. For implementation work, the
summary can be short, but evidence must be present in the task artifact or
state files.

## State Update Model

After each iteration, update these files when applicable:

- `.agents/state/current-focus.md`: what the system is currently optimizing
- `.agents/state/known-issues.md`: unresolved problems and risk classification
- `.agents/state/module-confidence-ledger.md`: module and journey confidence,
  evidence, broken flows, and next proof or fix
- `.agents/state/regression-log.md`: regressions found, fixed, or monitored
- `.agents/state/system-health.md`: latest validation and runtime health signal
- `.agents/state/next-steps.md`: next executable tiny tasks in priority order
- `.codex/context/TASK_BOARD.md`: canonical queue state
- `.codex/context/PROJECT_STATE.md`: durable project progress
- `.codex/context/LEARNING_JOURNAL.md`: recurring verified pitfalls
- relevant `docs/*`: architecture, contracts, flows, modules, testing, UX,
  operations, governance, or planning truth that changed

## App Build Continuity

- Use `docs/governance/app-creation-playbook.md` for new apps and major product surfaces.
- Treat accepted user feedback as durable repo memory through `docs/governance/user-feedback-loop.md`.
- Use `.codex/templates/handoff-packet-template.md` for substantial or multi-session handoffs.
