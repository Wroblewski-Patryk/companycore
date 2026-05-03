---
name: adopt_template_into_existing_project
description: Apply this agent template to an existing repository without overwriting project truth. Use when migrating an established project onto the template's agent workflow.
---

# Adopt Template Into Existing Project

## Procedure

## Step 1

Snapshot the repository before edits.

- Check branch and working tree status.
- Identify uncommitted user changes.
- List current docs, validation commands, deploy files, and project entry
  points.

## Step 2

Map current project truth.

- Product and phase
- Stack and package managers
- Real test and smoke commands
- Deployment target or explicit unknown
- High-risk domains: production data, secrets, payments, AI behavior,
  background jobs, external integrations

## Step 3

Install only the minimal agent context first.

- `AGENTS.md`
- `.agents/workflows/*`
- `.codex/context/PROJECT_STATE.md`
- `.codex/context/TASK_BOARD.md`
- `DEFINITION_OF_DONE.md`
- `NO_TEMPORARY_SOLUTIONS.md`

Adapt wording to the repository instead of copying unresolved template
assumptions.

## Step 4

Run the governance fit check from
`docs/governance/existing-project-adoption-playbook.md`.

For every mismatch, mark it as adopt, adapt, defer, or reject.

## Step 5

Create the first safe queue.

- Prefer validation repair, docs reconciliation, smoke checks, and small
  evidence-backed fixes.
- Avoid broad rewrites, redesigns, deploy changes, or AI behavior changes until
  context and checks are stable.

## Step 6

Run `docs/governance/agent-readiness-checklist.md`.

Do not call the project agent-ready until the checklist passes or every gap is
tracked.

## Validation

- no template placeholder paths remain
- no references to sibling repositories or `!template`
- required instruction files exist
- validation commands are real or explicitly blocked
- task board and planning queue agree
- uncommitted user changes were preserved

## Output

- factual project-state update
- small actionable task queue
- adoption decision notes or tracked gaps
- clear statement of whether autonomous implementation can start
