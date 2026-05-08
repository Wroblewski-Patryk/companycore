# Visual Direction Brief

Use this file at project start or before major redesign work.

Its purpose is to define a strong visual thesis early so implementation does
not drift into generic default UI.

## How To Use

- Fill this brief before broad frontend expansion.
- Keep it short enough to guide decisions quickly.
- Update it when the product direction changes meaningfully.
- Keep it aligned with `docs/ux/design-system-contract.md` and
  `docs/ux/design-memory.md`.

## Brief Template

```markdown
# Visual Direction Brief

## Product Character
- Brand feeling:
- Trust posture:
- Energy level:
- Keywords:

## Visual Thesis
- One-sentence direction:
- Why this fits the product:

## Typography
- Heading style:
- Body style:
- Density:
- What to avoid:

## Color Strategy
- Primary mood:
- Accent usage:
- Surface strategy:
- Contrast posture:

## Decorative Asset Strategy
- Background style:
- Illustration or motif style:
- Raster assets allowed: yes | no
- SVG assets allowed: yes | no
- Approximation tolerance:

## Shape And Spacing
- Radius language:
- Border vs shadow preference:
- Spacing rhythm:
- Container feel:

## Motion
- Motion character:
- Motion use cases:
- Motion to avoid:

## UX Priorities
- What must feel effortless:
- What should feel premium:
- What should feel fast:

## Surface Notes
- Mobile:
- Tablet:
- Desktop:

## Explicit Avoids
- Avoid 1:
- Avoid 2:
- Avoid 3:
```

## Minimum Quality Bar

- The brief must be specific enough to influence real implementation choices.
- "Modern", "clean", and "nice" are not enough on their own.
- Include at least one explicit statement about mobile, tablet, and desktop.
- Include at least three explicit avoids.
- If the product depends on decorative backgrounds or illustration, include an
  explicit asset strategy.

## CompanyCore Canonical Visual Direction

### Product Character

- Brand feeling: precise, trustworthy, operational, calm.
- Trust posture: owner-grade company infrastructure; decisions should feel
  reversible, traceable, and safe.
- Energy level: focused and quietly confident, with low decorative noise.
- Keywords: command center, company map, operating clarity, review queue,
  accountable action.

### Visual Thesis

- One-sentence direction: CompanyCore should feel like a clear operational
  cockpit that helps owners locate company structure, blockers, integrations,
  and next actions without hunting.
- Why this fits the product: the user is managing a real company system, so the
  interface must prioritize orientation, status, and direct action over
  marketing-style flourish.

### Typography

- Heading style: compact, high-confidence labels with enough weight to anchor
  panels but not oversized hero typography inside tools.
- Body style: readable operational copy with short recovery guidance and
  explicit destination names.
- Density: medium-to-compact on desktop, slightly more spacious on touch
  surfaces.
- What to avoid: browser-default control text, oversized dashboard headings,
  long explanatory paragraphs in dense work areas, and negative letter spacing.

### Color Strategy

- Primary mood: white and soft-blue operational surfaces with clear borders.
- Accent usage: use blue for primary navigation/action context, green for
  healthy/ready states, amber for review, and red only for blocked or unsafe
  states.
- Surface strategy: panels and rows should be distinguishable by role:
  command, filter, list, detail, local feedback, and secondary exploration.
- Contrast posture: text-first and AA-oriented; never rely on color alone for
  status.

### Decorative Asset Strategy

- Background style: subtle app surfaces, not decorative gradients or blobs.
- Illustration or motif style: operational icons and structured diagrams only
  when they clarify navigation or relationships.
- Raster assets allowed: no for routine dashboard chrome; yes only for approved
  product/brand imagery or documented decorative assets.
- SVG assets allowed: yes for diagrams or product-specific marks.
- Approximation tolerance: low for canonical UI patterns and status visuals.

### Shape And Spacing

- Radius language: 8px or less for panels, rows, buttons, and icon containers
  unless an existing approved pattern says otherwise.
- Border vs shadow preference: borders first, restrained shadows only for
  selected/detail emphasis or elevated overlays.
- Spacing rhythm: clear gutters, compact row gaps, and enough air around the
  primary command area.
- Container feel: avoid nested cards; use panels for primary sections, rows for
  repeated items, and tables for comparable operational data.

### Motion

- Motion character: minimal and functional.
- Motion use cases: opening navigation, focusing selected state, showing
  pending/success/error feedback, and preserving perceived continuity.
- Motion to avoid: decorative loops, distracting hover effects, and movement
  that shifts dense layouts.

### UX Priorities

- What must feel effortless: finding the next action, seeing blockers,
  understanding the company operating area, and moving from summary to the
  exact workbench.
- What should feel premium: the dashboard command surface, relationship review,
  data tables, and integration setup feedback.
- What should feel fast: route changes, filters, table scanning, and local
  action feedback.

### Surface Notes

- Mobile: lead with the action/form/content, keep navigation in the drawer,
  preserve sign-out, and avoid pushing primary content below repeated shell
  controls.
- Tablet: keep two-column structure only when both columns remain scannable;
  otherwise stack command before exploration.
- Desktop: use density thoughtfully; dashboards should show command, blocker,
  readiness, and module destination without forcing scrolling to understand the
  state.

### Explicit Avoids

- Avoid marketing landing-page composition inside private operational routes.
- Avoid generic icon decoration that does not improve orientation.
- Avoid equal-weight cards where command, filter, table/list, selected detail,
  and feedback roles need different visual priority.
- Avoid raw provider/backend errors in the UI; show recovery copy near the
  action that failed.
- Avoid introducing Tailwind/DaisyUI classes without an approved frontend
  architecture migration.
