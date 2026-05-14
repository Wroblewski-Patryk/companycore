# Design System Contract

This document defines how agents should treat the visual layer of the
application.

## Purpose

When a project has an established UI layer, it becomes the source of truth for:

- component styles
- visual tokens
- art direction
- spacing and layout patterns
- interaction states
- motion rules
- responsive behavior by surface

The goal is consistency, not one-off reinvention.

The visual target is not merely "acceptable" UI. The system should help teams
ship interfaces that feel clear, confident, and pleasant to use across mobile,
tablet, and desktop.

## Experience Quality Bar

Every meaningful UI change should preserve or improve:

- clear visual hierarchy
- readable spacing rhythm
- accessible contrast and type sizing
- explicit interaction states
- adaptive behavior across screen sizes
- purposeful motion, not decorative noise
- a recognizable visual point of view instead of generic default styling

## Reuse-First Rule

- Prefer an existing shared component or approved variant before creating a new
  one.
- Prefer extending an approved shared pattern over adding page-local styling.
- Reuse the best matching button, input, card, modal, table, badge, and form
  patterns that already exist.
- Create a new shared component or variant only when no approved pattern fits
  the need.
- Reuse approved page rhythms, density rules, and navigation patterns before
  inventing new ones.
- Reuse previously approved visual motifs recorded in `docs/ux/design-memory.md`
  when they still fit the product.

## CompanyCore Management UI Principles

CompanyCore is an owner console for understanding and steering a company. The
approved 2026-05-14 visual metaphor is a cinematic-realistic Company City Map:
the company is a strategic city/value ecosystem, `GENERAL` is the central
intake and orchestration district, and the 12 company departments are connected
operational districts in the value journey. The UI must help the user answer
three questions quickly:

- What matters now?
- What is blocked or needs review?
- Where do I go next to act?

Every dashboard, workbench, settings, and integration surface should make those
answers visible before secondary exploration. Dense management screens should
feel calm and operational, not promotional.

The city metaphor should be used most strongly on the logged-in dashboard,
operating-area overview, and high-level relationship/integration maps. Detail
workbenches may become quieter and more table/list driven, but they should
retain district identity, value-flow context, and command-brief language.

Light gamification is allowed when it reflects real company state: district
readiness, value-flow progress, verified milestones, automation unlocks,
mission completion, and health signals. Do not add fake scores, arbitrary
badges, or decorative rewards that are not backed by real tasks, evidence,
integrations, or operating progress.

Responsive rule: desktop web may show the full city canvas with side command
briefs; tablet should balance map plus selected context; mobile web and native
mobile should compress the city into an overview, district switcher, or
progressive drill-down rather than forcing a tiny unreadable map.

## Authenticated Shell Contract

All private web routes should converge on one CompanyCore shell rather than
separate vanilla and React navigation models. Before V2 Company City visuals,
the shell should be a clear operating console: workspace selection, operating
areas, resource families, integration relationships, and MCP readiness. The
shell must make workspace, active route, active company area or workbench
family, command pressure, and health visible without making every route build
its own product chrome.

Canonical shell zones:

- `CompanySidebar`: command/company/workbench/integration/workspace navigation.
- `TopCommandBar`: command search, create/action launch, attention, account.
- `CommandBriefPanel`: contextual next action, blockers, decisions, risks,
  integration state, and agent-ready actions.
- `CompanyAreaSwitcher`: `00 Ogolny` plus the 12 departments, usually as
  active/pinned areas plus a switcher instead of a permanent full list.
- `StatusStrip`: quiet workspace health, sync freshness, environment, and
  agent/integration readiness.

Responsive behavior:

- Desktop: persistent sidebar, top command bar, optional right command brief,
  and status strip.
- Tablet: compact rail or drawer rail with split map/workbench and contextual
  command panel when space allows.
- Mobile: compact topbar, drawer for full IA, optional bottom shortcuts for
  core destinations, command brief before broad stats, and map as overview or
  district switcher instead of a tiny full canvas.

The sidebar should not remain a generic route directory. It should express the
operating model: Workspace selector, Operating Areas, Workbenches, Integrations
& Relationships, AI/MCP, and Workspace settings. Badges and readiness signals
must come from real product state. Do not introduce a second route-local shell
for React surfaces.

## Iconography

- Approved icon family: Phosphor Icons, using the local bold webfont in
  `public/vendor/phosphor/bold/`.
- Use icons to clarify operational concepts: company structure, integrations,
  data, relationships, execution, pipeline, files, warnings, and settings.
- Icons should sit in an 8px-radius square container when they label a module,
  readiness signal, attention item, or dashboard step.
- Icons are decorative when adjacent text already names the concept; keep
  visible text as the accessible source of truth.
- Do not mix icon families on the same surface unless an existing branded
  provider mark requires it.
- Avoid icon-only navigation for business-critical actions unless the control
  has an accessible name, tooltip where appropriate, and a well-established
  symbol.

## Component Strategy

- The accepted UXA-009 migration foundation is React + Vite + Tailwind CSS +
  DaisyUI, built from `web/` into generated `public/react/` assets.
- The current production owner console remains vanilla until each route is
  migrated intentionally. Do not rewrite multiple routes in one task unless a
  migration plan explicitly scopes that wave.
- Wrap DaisyUI usage in project-specific React primitives where a pattern will
  repeat: app shell, buttons, alerts/toasts, tables, filters, module links,
  command panels, empty states, and form fields.
- Use DaisyUI component classes for known primitives, then tune with
  CompanyCore tokens instead of creating unrelated page-local class recipes.
- Preserve the existing vanilla patterns until their React replacement has
  parity evidence and route-level smoke coverage.

## Forbidden Behaviors

- creating a custom button style for a single screen when a reusable button
  already exists
- adding component-specific spacing, color, or motion rules that bypass the
  system without approval
- shipping dedicated per-instance visual props that fragment the design system
- silently restyling existing shared components for a local task
- shipping visually flat screens with no deliberate hierarchy, spacing rhythm,
  or state differentiation
- treating desktop as a stretched mobile screen or tablet as an afterthought
- copying fashionable effects that hurt readability, navigation, or perceived
  performance
- approximating canonical decorative imagery with generic gradients or blur
  blobs when real assets are required for fidelity

## When A New Pattern Is Allowed

Create a new shared pattern only when:

- there is no acceptable existing component or variant
- the new pattern solves a repeatable need, not a one-off exception
- it is documented so future work can reuse it
- its responsive and accessibility behavior is documented, not implied

If a project lacks a formal design system file, record the approved shared
patterns in project UX docs before large UI expansion.

## Agent Behavior

- treat the current visual system as a contract
- prefer reuse over invention
- if the visual system is clearly insufficient, propose the improvement in
  conversation before changing the system direction
- when creating a new shared pattern, update the relevant UX or component docs
- when a project has no strong visual direction yet, define one before
  expanding the surface area
- keep navigation, density, and interaction patterns appropriate to the active
  surface size and input mode
- treat canonical screenshots, approved mockups, and approved visual frames as
  implementation specifications when the task requires parity

## Validation Expectations

For UI tasks, record:

- which existing pattern was reused
- whether a new shared pattern was introduced
- which approved visual direction or motif was reused
- responsive checks
- accessibility checks
- state coverage: `loading`, `empty`, `error`, `success`
- surface behavior: `mobile`, `tablet`, `desktop`
- whether the result should be added to `docs/ux/design-memory.md`
- whether decorative and background elements were implemented with the correct
  asset strategy
