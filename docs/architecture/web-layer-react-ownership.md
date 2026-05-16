# Web Layer React Ownership

Last updated: 2026-05-16

## Decision

CompanyCore web UI is React-owned. The backend may still serve static files,
health endpoints, and JSON APIs, but user-facing web routes must render through
the Vite React bundle in `public/react/index.html`.

As of 2026-05-16, `/` is the canonical public home route and
`/areas?area=00-ogolny&view=overview` is the canonical authenticated
post-login landing route. `/dashboard` and `/react-dashboard` remain temporary
compatibility aliases that redirect to the `00 Ogolny` selected-area
dashboard.

As of WEB-CORE-001 on 2026-05-16, the active React web product has been
intentionally narrowed. The only active web views are public home, login,
registration, `00 General`, `04 Operations`, and `08 Assets`. Historical v0/v1
workbenches such as settings, data, relationships, tasks, pipeline,
Company OS cockpit, and MCP catalog are not active web screens. Their backend
APIs remain in place for future department-system rebuilds.

React route metadata now lives in `web/src/app-route-registry.ts`. That file is
the source of truth for the current active route set, compatibility aliases,
shell navigation entries, route titles, and safe post-auth redirect
normalization. Future web views must extend the registry and the view index
only after a scoped department-system task accepts them.

The legacy vanilla owner console files under `public/` are removed from the
active runtime path:

- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `public/relationship-workbench.js`
- `public/google-drive-workbench.js`

## Route Ownership

The Express web host serves the React bundle for:

- `/`
- `/auth/login`
- `/auth/register`
- `/dashboard`
- `/areas`
- `/react-dashboard`

Active private route behavior:

- `/areas?area=00-ogolny&view=overview`: canonical `00 General` dashboard.
- `/areas?area=04-operacje&view=overview`: `04 Operations`.
- `/areas?area=08-zasoby&view=overview`: `08 Assets`.
- `/dashboard`, `/react-dashboard`, and bare `/areas`: compatibility entries
  that normalize to the `00 General` dashboard.
- `/operations`: compatibility entry that normalizes to the `04 Operations`
  selected-area view.

Old private web paths may still be served by the SPA fallback, but they must
show an archived-route notice instead of their former screen body. They are not
active product views.

API hosts still use the existing JSON API behavior. Protected backend contracts
remain under `/v1/*` and root protected compatibility routes.

## Implementation Rules

- New web UI must be implemented in `web/src/` using React, Tailwind, DaisyUI,
  and existing shared CompanyCore primitives.
- Do not reintroduce page-local vanilla JavaScript for product routes.
- Shared data fetching, auth redirect behavior, and route primitives should
  live in React helpers or route-kit modules, not global browser scripts.
- Add new authenticated views through `web/src/app-route-registry.ts` first,
  then bind the route component in `web/src/main.tsx`. Do this only from an
  accepted department-system task contract.
- Shared shell navigation must be derived from the route registry so desktop
  and mobile route chrome stay consistent.
- React views must consume existing backend endpoints. UI may simplify a
  workflow during migration, but it must not fake backend state.
- Deep workflows that were previously only vanilla must be rebuilt as React
  slices against the existing backend contracts.

## Current React Coverage

The current active React coverage is:

- public home;
- owner login;
- owner registration;
- `00 General` post-login dashboard;
- `04 Operations` management read view;
- `08 Assets` management read view;
- archived-route notice for old private web paths.

These views consume existing backend contracts where applicable. The removed
web views are not deleted from backend architecture; they are simply not active
as user-facing screens until rebuilt as department-specific management systems.

## Area Detail Routing

The active area-first surface uses `/areas?area=:areaKey&view=overview` for
the approved management systems. Only these department keys are active in web:

- `00-ogolny`
- `04-operacje`
- `08-zasoby`

Other `00`-`12` departments may be displayed as planned architecture context
inside `00 General`, but they must not open unfinished web screens before a
new scoped implementation task rebuilds them.

## Known Follow-Up

Settings, data, relationship review, tasks, pipeline, Company OS cockpit, MCP
catalog, and connector workbenches are future rebuild candidates, not active
web surfaces. Reintroduce them only through a department-specific management
system or explicit admin/settings task contract.
