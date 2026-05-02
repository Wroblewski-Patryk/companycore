# Open Decisions

Track unresolved decisions that can block or reshape execution.

## Active Decisions

- DEC-001 API namespace for v1
  - Question: Should v1 keep the current root-level endpoints
    (`/projects`, `/tasks`, `/events`) or introduce `/api/v1/*` before external
    consumers depend on the API?
  - Why it matters: Paperclip, Jarvis, n8n, and future GUI clients need a
    stable base path. Changing it later would require client migration.
  - Options:
    - Keep root-level endpoints for v1 and document them as stable.
    - Add `/api/v1/*` now while preserving root-level aliases during a short
      transition.
    - Add `/api/v1/*` only when a breaking v2 API appears.
  - Needed by: CCV1-008
  - Current owner: Planner / Backend Builder

- DEC-003 Missing module API scope for v1
  - Question: Which DB-backed modules need public API routes in v1:
    task lists, pipeline stages, interactions, decisions, agents, and agent
    logs?
  - Why it matters: The schema already includes these entities, but adding
    routes without real workflows may expand the API surface too early.
  - Options:
    - Add minimal GET/POST routes for all existing models.
    - Add routes only for decisions and agent logs because AI consumers need
      durable memory and traceability.
    - Keep README-only placeholders until Paperclip/Jarvis workflows are
      specified.
  - Needed by: CCV1-008
  - Current owner: Product Docs / Backend Builder

## Resolved Decisions

- 2026-05-02: CompanyCore v1 has no GUI.
- 2026-05-02: PostgreSQL is the source of truth.
- 2026-05-02: Backend API is the only supported access layer.
- 2026-05-02: CompanyCore v1 should include native direct ClickUp API
  integration as the first integration adapter. n8n is optional orchestration,
  not the required primary path.
- 2026-05-02: CompanyCore v1 should include a workspace ownership boundary.
  Registration creates an owner user and a workspace, and integration settings
  are assigned to the workspace.
- 2026-05-02: Owner authentication uses email/password with hashed password
  storage for v1. Token/session implementation details remain scoped to
  CCV1-012.
- 2026-05-02: v1 supports both owner-user auth for humans/API clients and
  hashed workspace-scoped service API keys for Paperclip, Jarvis, n8n, and
  other agents.
- 2026-05-02: v1 includes `workspace_memberships` now for future growth, but
  only the `owner` role is active. Invitations, non-owner roles, and advanced
  RBAC are deferred.
- 2026-05-02: Production deployments use `prisma migrate deploy` during backend
  startup. Local development may use `prisma migrate dev`; `db push` is not the
  production path.
- 2026-05-02: DEC-005 resolved. The smallest v1-native ClickUp slice is
  pull-only task sync from workspace-configured ClickUp lists into CompanyCore
  tasks. It does not write changes back to ClickUp in v1.
