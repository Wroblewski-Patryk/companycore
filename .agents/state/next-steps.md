# Next Steps

Last updated: 2026-05-16

## NOW

1. Convert `/data` and `/data/:table` into a V1 evidence browser.
   - `/operations` and `/tasks-adapter` are locally verified V1 command
     surfaces with PostgreSQL-backed API tests and real backend Playwright
     proof.
   - The next V0 route in the V1 web index is the data/table evidence browser.
   - Keep the slice on existing table APIs and agent-readable context; do not
     add raw schema or fake department ownership.

## NEXT

1. Use the CompanyCore business module map during upcoming product intake.
   - Source: `docs/architecture/companycore-business-module-map.md`.
   - Apply it before settings, Drive, ClickUp, CRM, pipeline, knowledge,
     resource, or agent work so each slice is classified as native core,
     provider-backed, future adapter, or derived view.
   - This is a planning guardrail, not a runtime task that displaces the next
     production proof.
2. Use the CompanyCore global business flow during upcoming CRM, marketing,
   delivery, finance, support, feedback, graph, dashboard, or AI-agent intake.
   - Source: `docs/architecture/companycore-global-business-flow.md`.
   - Map the request to the 13-stage value pipeline before adding runtime
     surfaces.
   - Start with read models and visualization before adding write behavior,
     billing/payment commands, survey flows, or generic graph relations.
3. Use the department management systems architecture before generating or
   implementing department views.
   - Source: `docs/architecture/department-management-systems-architecture.md`.
   - View map: `docs/ux/v1-department-management-systems-view-map.md`.
   - Prompt pack: `docs/ux/v1-department-system-prompt-pack.md`.
   - Generate one department spec at a time, then implement one read-only
     department shell before adding writes.
4. Run database-backed or production smoke for the `04 Operacje` department
   system after deploy.
   - Route: `/areas?area=04-operacje&view=overview`.
   - Source: `docs/planning/operations-management-system-v1-task-contract.md`.
   - Frontend proof is complete with mocked owner data; target proof should
     use a real owner session and deployed/current database data.
5. AOG-BE-002 through AOG-BE-006 backend graph follow-ups.
   - After deployed AOG read proof is complete, plan and implement:
     `Target.metricId`,
     goal/workflow bridge, normalized workflow-task links, knowledge/source
     link contract, and read-only MCP exposure. Keep write relations
     command-shaped and avoid generic edge CRUD.
6. AGRUN-010 Upstream Agent Source Merge Execution.
   - Blocked until upstream write access or an approved fork/PR route exists.
7. Production push-to-running-image smoke after the next deploy.
   - Build metadata restoration is implemented locally; after deploy, compare
     public `/health` `build.commit` with the pushed commit before claiming
     auto-deploy proof.
8. Production AOG/settings smoke.
   - After the next deploy, compare public `/health` build metadata with the
     pushed commit.
   - Smoke `/v1/operating-graph/areas/01-strategia` and authenticated settings
     before raising production confidence.
9. V1 operations route-depth slices.
   - Deepen one existing-contract workbench from the operations cockpit:
     `data` or `relationships`.
10. Production smoke for locally verified V1 command surfaces.
   - After the next deploy, compare public `/health` build metadata with the
     pushed commit.
   - Smoke `/v1/operating-graph/areas/01-strategia`, authenticated settings,
     authenticated `/operations`, and authenticated `/tasks-adapter`.
11. V1AREA capability actions.
   - Add create/edit/filter actions only where an existing backend contract
     already supports the selected capability safely.

## LATER

1. ACF-UX-002 Company City Dashboard / Gamified Strategic Map.
   - Deferred to V2 readiness gate.
2. ACF-OPS-001 Auto-Deploy Proof Or Manual Path Acceptance.
3. ACF-QA-001 Lint And Split Test Gates.
4. AGRUN-010 Upstream Agent Source Merge Execution, blocked until upstream
   write access or an approved fork/PR route exists.

## Selection Rules

- Pick one bounded mission objective for each autonomous iteration; use small
  checkpoint tasks inside that mission when useful.
- Prefer tasks that reduce blocker risk, regression risk, or unclear source of
  truth.
- Do not start new feature work when a P0/P1 regression or release blocker is
  unresolved.
- Keep this file synchronized with `.codex/context/TASK_BOARD.md` and
  `docs/planning/mvp-next-commits.md`.
