# Known Issues

Last updated: 2026-05-16

## Open Issues

| ID | Severity | Area | Summary | Owner | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| KI-009 | P1 | Google Drive changes reconciliation | Production selected-scope Drive import works and the table has no missing or unassigned records, but `POST /v1/integration-settings/google_drive/changes/reconcile` returned `422 sync_failed` during the 2026-05-16 production audit. | Ops/Release + Backend | OPEN | Diagnose the stored changes page token / OAuth changes-list path; until fixed, use protected `import` with `merge` or `inspect_only` for selected-scope catch-up evidence. |
| KI-010 | P1 | Paperclip runtime key selection | CompanyCore has active Paperclip bridge keys with Google Drive scopes, but older active `Paperclip production adapter` keys remain present with narrow legacy scopes. Paperclip may miss Drive data if its runtime still uses an old key. | AI Integration + Ops/Release | OPEN | Confirm Paperclip runtime uses the newer Paperclip bridge key; if not, rotate a fresh key from `/settings/api` and store it only in Paperclip's secret store. |
| KI-008 | P2 | Google Drive production OAuth write/read samples | Historical production OAuth decrypt/write-read evidence was stale after a prior secret incident. The 2026-05-16 production audit proves the stored Google Drive OAuth path can list/import selected folders and refresh content snapshots, but Docs/Sheets write samples and `changes/reconcile` still need targeted proof. | Ops/Release + Owner | MITIGATED | Run a target-safe Docs/Sheets write/read smoke and the KI-009 changes-reconcile diagnostic before closing the historical OAuth concern completely. |
| KI-007 | P1 | Product data completeness | Production `/v1/operating-model` has 13 areas and 26 external mappings but `0` storage locations, `0` knowledge roots, `0` automation definitions, and `/v1/projects` returns `0` while tasks exist. | Product + Backend | OPEN | Execute ACF-PROD-001 to decide, seed, import, or explicitly defer these owner-facing operating model records. |
| KI-002 | P2 | Release automation | GitHub-to-Coolify auto-deploy is not proven as reliable; manual VPS/Coolify backend rollover remains the accepted and approved path. | Ops/Release | ACCEPTED | After the next deploy, compare public `/health` `build.commit` with the pushed commit before claiming push-to-running-image proof. |
| KI-003 | P2 | Source handoff | Paperclip and OpenJarvis validated source changes could not be pushed upstream because GitHub returned `403`. | Ops/Release | BLOCKED | Resume AGRUN-010 after write access or an approved fork/PR route exists. |

## Accepted Residual Risks

- 2026-05-06: Manual VPS/Coolify rollover remains an accepted v1 release path
  while GitHub-to-Coolify webhook/auto-deploy administration is unresolved.
- 2026-05-15: ACF-OPS-001 refreshed public web/API health evidence. Both
  domains are healthy, but `/health` reports `commit: unknown` and
  `image: unknown`, so automatic deployment cannot be proven from public
  metadata. Manual VPS/Coolify rollover remains the accepted path.
- 2026-05-15: ACF-OPS-002 restored source-level build metadata wiring and
  regression coverage. The release-automation proof gap remains accepted until
  the next deployed runtime is checked through public `/health`.
- 2026-05-15: Post-push public smoke after `ec82a1a` returned `200` for
  `https://api.companycore.luckysparrow.ch/health`,
  `https://api.companycore.luckysparrow.ch/v1/health`, and
  `https://companycore.luckysparrow.ch/`, but both API health endpoints still
  reported `build.commit="unknown"` and `build.image="unknown"`. Treat this as
  uptime evidence only, not push-to-running-image proof.

## Recently Closed Issues

- V1 runtime readiness: closed by `docs/operations/v1-operator-handoff.md` and
  `docs/operations/v1-release-readiness.md`.
- KI-004 authenticated private-route screenshot gap: closed by UXA-002 on
  2026-05-08 with `owner-console:ux-smoke`, covering seven private routes at
  desktop/tablet/mobile and reporting zero console issues.
- Deploy automation evidence drift: closed by AGRUN-009 on 2026-05-08; the
  historical `63348d6` note is not accepted as superseding operations evidence.
- KI-004 Company OS cockpit generic collection 404s: closed by
  V2WEB-AGENT-022 on 2026-05-14. Shared table-record path resolution now sends
  Company OS collection slugs to `/v1/company-os/:collection`; mock render
  proof reported `badGeneric=[]`, `notFound=[]`, and `consoleErrors=[]`.
- KI-005 mobile overflow and focus accessibility: closed by ACF-UX-001 on
  2026-05-14. Desktop/mobile Playwright fallback checks for `/settings/api` and
  `/react-company-os` reported `horizontalOverflow=false`,
  `unnamedFocusableCount=0`, no console warnings/errors, and no relevant failed
  requests.
- KI-006 production secret and CORS hardening: closed by ACF-SEC-001 on
  2026-05-14. `npm test` against disposable PostgreSQL on `localhost:55452`
  verified missing-secret failure, development-placeholder rejection,
  production CORS allow/deny behavior, and the existing protected API flow.
