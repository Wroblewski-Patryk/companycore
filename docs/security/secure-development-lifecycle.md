# Secure Development Lifecycle

Use this for auth, AI, money, user data, admin tooling, integrations, secrets,
permissions, and any feature with meaningful abuse potential.

## Security Lifecycle

1. Requirements
   - Identify protected data, identities, roles, and permissions.
   - Define compliance or privacy constraints if applicable.
2. Design
   - Draw trust boundaries.
   - Identify abuse cases and likely attacker goals.
   - Prefer approved security primitives and existing permission paths.
3. Implementation
   - Keep secrets out of code and logs.
   - Validate inputs at the boundary.
   - Enforce authorization server-side or at the trusted boundary.
   - Fail closed when ownership, identity, payment, or AI policy is uncertain.
4. Verification
   - Test allowed and denied paths.
   - Run static, dependency, or secret scans when available.
   - Include adversarial checks for AI-assisted flows.
5. Release
   - Confirm secure defaults, env ownership, logging safety, and rollback.
6. Response
   - Record incidents, suspected bypasses, and regression tests.

## Lightweight Threat Model

Use this prompt when risk is meaningful:

- Assets:
- Actors:
- Trust boundaries:
- Entry points:
- Abuse cases:
- Required controls:
- Tests or checks:
- Residual risk:

## CompanyCore v1 Threat Model

- Assets:
  - owner credentials
  - workspace business data
  - workspace service API keys
  - ClickUp and future integration tokens
  - agent logs and operational memory
- Actors:
  - workspace owner
  - Paperclip/Jarvis/service agents
  - optional n8n workflows
  - unauthenticated internet clients
  - misconfigured or compromised integration providers
- Trust boundaries:
  - public API boundary
  - auth/session or token boundary
  - workspace ownership boundary
  - service API key boundary
  - integration provider API boundary
  - database persistence boundary
- Entry points:
  - auth endpoints
  - protected business endpoints
  - service API key middleware
  - integration settings endpoints
  - ClickUp discovery/sync endpoints
- Abuse cases:
  - cross-workspace data read/write
  - leaked API key or integration token
  - brute-force login attempts
  - provider error leaking secret or raw backend details
  - AI agent using stale or overbroad credentials
  - sync creating duplicate or corrupted records
- Required controls:
  - hashed passwords
  - hashed service API keys
  - workspace-scoped authorization on every protected route
  - secret redaction in responses and logs
  - stable safe error codes
  - idempotent external sync by `(workspace_id, source, external_id)`
  - denied-path tests for auth and workspace access
- Tests or checks:
  - registration/login success and failure
  - unauthenticated denied path
  - wrong-workspace denied path
  - inactive API key denied path
  - secret values redacted
  - ClickUp failure returns safe error and preserves data
- Residual risk:
  - rate limiting and lockout policy still need implementation planning
  - token/session storage details must be finalized during CCV1-012
  - production secret rotation must be verified during deployment tasks

## Hard Blocks

Do not ship when:

- authorization is incomplete or only client-side
- secrets are committed, logged, or exposed to the browser unintentionally
- user data ownership is ambiguous
- workspace scoping is missing from protected data access
- integration tokens can be read from API responses
- AI output can trigger privileged actions without policy checks
- money-impacting behavior lacks fail-closed validation
- security evidence is missing for a high-risk change
