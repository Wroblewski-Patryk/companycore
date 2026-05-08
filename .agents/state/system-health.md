# System Health

Last updated: 2026-05-08

## Latest Validation Snapshot

| Check | Command or method | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| lint | Not configured | NOT APPLICABLE | `.codex/context/PROJECT_STATE.md` validation commands | Project has no lint script. |
| typecheck | `npm run build` | PASS (latest recorded) | `docs/operations/v1-operator-handoff.md`; recent V2WEB task evidence in `.codex/context/PROJECT_STATE.md` | Build is the project typecheck gate. |
| tests | `docker compose exec -T backend sh -lc "npm run prisma:migrate:deploy && node --test 'dist/tests/**/*.test.js'"` | PASS | 2026-05-08 UXA-002 | Direct host `npm test` still requires a host-reachable `DATABASE_URL`; compose Postgres is internal only, so the integration test was run inside the backend container. |
| build | `npm run build` | PASS | 2026-05-08 UXA-003 | TypeScript build passed after dashboard markup, JS, and CSS changes. |
| smoke | Production public health smoke | PASS | 2026-05-08 AGRUN-009 public checks | `/health`, `/v1/health`, and web root returned `200`; `/health` reported build `71f3eb3b063ea68226a1736c727c52882b33f27a`. |
| ux/private smoke | `npm run owner-console:ux-smoke` against `http://localhost:3000` | PASS | `C:\Users\wrobl\AppData\Local\Temp\companycore-ux-smoke\2026-05-08T19-47-08-826Z` | Captured `/dashboard`, `/data`, `/data/tasks`, `/areas`, `/relationships`, `/settings/drive`, and `/settings/api` at desktop/tablet/mobile plus desktop interaction screenshots; report contained zero console issues. |
| ux/dashboard smoke | `npm run owner-console:ux-smoke` against isolated `http://localhost:3002` | PASS | `C:\Users\wrobl\AppData\Local\Temp\companycore-ux-smoke\2026-05-08T20-00-12-315Z` | UXA-003 dashboard screenshots show a dominant current-priority action, compact readiness evidence, top attention items, and secondary module exploration across desktop/tablet/mobile. |
| ux/browser | Production public/auth Browser audit | PARTIAL PASS | 2026-05-08 UXA-001 | Public entry, login, register, and mobile auth rendered with no relevant console warnings/errors; authenticated Browser entry was blocked by an automation issue on `input[type=email]`. |
| local runtime | Docker local runtime for UX audit | PASS | 2026-05-08 UXA-001 | Local backend ran on `http://localhost:3001`; `/health` returned `ok`; migrations and seed completed. |
| web editor markers | Production `app.js` marker check | PASS | 2026-05-08 AGRUN-008 public `app.js` check | Typed editor markers for Notes, Projects, Clients, Task Lists, and Tasks are present. |
| operator handoff parity | Docs review | PASS | 2026-05-08 CCV1-062 | `v1-operator-handoff.md` and rollback docs now reference the current public health build and note the SSH inventory limitation. |

## Runtime Health

- Production CompanyCore, Jarvis, and Paperclip health were green in the latest
  v1 handoff evidence.
- CompanyCore public health currently reports image
  `rnqqkhl3o3dut4qv56mlxly2_backend:71f3eb3b063ea68226a1736c727c52882b33f27a`.
- Known blockers are external: Google Drive owner consent/import,
  Paperclip/OpenJarvis upstream write access, and deploy-automation evidence
  reconciliation.
- Authenticated private-route UX screenshots now have an approved local
  Playwright path through `owner-console:ux-smoke`; UXA-003 used it to verify
  dashboard polish across desktop, tablet, and mobile.
- UX smoke that depends on seeded owner state should use an isolated compose
  project when the default local volume has been touched by integration tests.

## Quality Gate Notes

- Latest v1 handoff: `docs/operations/v1-operator-handoff.md`.
- Latest release readiness: `docs/operations/v1-release-readiness.md`.
- Required pre-commit contract remains the validation commands in
  `.codex/context/PROJECT_STATE.md`.
