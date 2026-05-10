# Requirements Verification System

Use this system to turn product intent into verifiable requirements. Significant
feature, journey, integration, architecture, UX, security, AI, mobile, ops, and
release work must be traceable from source to proof.

Core chain:

`source -> decision -> requirement -> delivery map -> mission -> code -> verification -> evidence -> confidence`

## Required State Files

- `.agents/state/requirements-verification-matrix.md`
- `.agents/state/quality-attribute-scenarios.md`
- `.agents/state/risk-register.md`

## Requirement Rules

- Use stable IDs such as `REQ-FUNC-###`, `REQ-UX-###`, `REQ-DATA-###`,
  `REQ-API-###`, `REQ-AI-###`, `REQ-SEC-###`, `REQ-OPS-###`, and
  `REQ-MOB-###`.
- Every meaningful requirement needs a verification method: `test`,
  `inspection`, `demonstration`, or `analysis`.
- Use only evidence-backed statuses: `proposed`, `accepted`, `in_progress`,
  `implemented_not_verified`, `partially_verified`, `verified`, `failed`,
  `blocked`, `superseded`.
- Do not report work as done without updating the requirement matrix and module
  confidence ledger.
- For durable tables, use snake_case status names. Older narrative docs and
  module-confidence rows may use display labels such as `implemented, not
  verified` or `partially verified`; treat them as equivalent when reconciling
  state.

## Quality And Risk Rules

Capture quality scenarios when a change affects usability, accessibility,
performance, reliability, security, maintainability, observability,
deployment, AI behavior, or mobile readiness.

Track risks when they can affect user trust, architecture, delivery, data,
security, money, AI actions, deployment, or maintainability.

## Tables, Analyses, And Reports

Durable tables should include stable ID, source, affected module, status,
evidence, next action, and last updated date. Free-form notes may explain
context, but actionable state belongs in a table, ledger, queue, checklist, or
register.

## Missing Table Bootstrap

If the requirement matrix, quality scenarios, risk register, delivery map, or
module confidence ledger is missing, empty, stale, or still contains sample
rows, rebuild a minimum viable version before selecting implementation work.

Use explicit source documents first. If a row is inferred from code, tests, or
older planning notes, say so in the source/evidence field and choose a cautious
status:

- explicit accepted product or architecture source -> `accepted`;
- code exists but proof is missing -> `implemented_not_verified`;
- partial proof exists -> `partially_verified`;
- plausible but not clearly approved -> `proposed`;
- cannot proceed safely without input -> `blocked`.

Do not invent product truth silently. Inferred rows are allowed so work can
continue, but they must be traceable, conservative, and easy for the owner or a
future agent to correct.

## Autonomous Continuation Rule

When the user says "continue", "next", "rob dalej", "jedziemy dalej", or
similar, first bootstrap missing, empty, stale, or template-like tables from
repository sources. Then choose the highest-value requirement that is `failed`,
`blocked`, `implemented_not_verified`, or release-critical `accepted`; then run
one mission tied to requirement IDs, verify it, and update all affected state
files.
