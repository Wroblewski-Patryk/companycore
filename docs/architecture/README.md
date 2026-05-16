# Architecture Documentation

This folder is the canonical source of truth for how the application works.

Use these files when the question is:

- what the system is
- how runtime flows work
- which entity owns which state or responsibility
- which invariants are fail-closed or non-negotiable

Do not use this folder for:

- execution plans
- rollout waves
- closure notes
- evidence packs
- module inventory
- implementation task history

Those belong elsewhere:

- `docs/planning/` for change sequencing and open work
- `docs/modules/` for code ownership and implementation deep-dives
- `docs/operations/` for runbooks, smoke checks, and evidence
- `docs/product/` for product intent and scope

## Reading Order

1. `architecture-source-of-truth.md`
2. `system-architecture.md`
3. `autonomous-company-operating-system.md`
4. `tech-stack.md`
5. `organizational-architecture-bridge.md`
6. `unified-organizational-operating-system.md`
7. `companycore-business-module-map.md`
8. `companycore-global-business-flow.md`
9. `department-management-systems-architecture.md`
10. `department-management-systems-v1-blueprint.md`
11. `company-os-definition-editing-contract.md`
12. `company-os-workflow-definition-command-contract.md`
13. any project-specific architecture or ADR files added later

## Architecture Rules

- one file should have one clear responsibility
- resolved architecture decisions belong here, not only in planning notes
- module docs may explain implementation, but they do not override this folder
- if a rule matters for runtime safety, ownership, or invariants, it must be
  explicit here
