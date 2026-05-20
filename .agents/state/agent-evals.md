# Agent Process Evals

Last updated: YYYY-MM-DD

Use this ledger to improve how Codex agents work together. It evaluates the
process, not only the code.

| ID | Date | Mission/task | Coordinator score | Lane split score | Brief clarity score | Proof score | Memory score | Main failure mode | Improvement for next mission | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AEV-000 | YYYY-MM-DD | Example mission | 0-5 | 0-5 | 0-5 | 0-5 | 0-5 | Replace sample row. | Replace sample row. | open |

## Scoring

- `0`: missing or harmful.
- `1`: present but unclear.
- `2`: usable with major gaps.
- `3`: acceptable.
- `4`: strong.
- `5`: excellent and reusable.

## Required Eval Triggers

- broad mission with subagents
- failed or partial validation
- architecture or UX direction choice
- repeated task churn
- user says work is going in circles
- coordinator discovers a missing lane, bad split, or weak proof

## Closure Rule

Close an eval row only after the next mission brief, hierarchy, lane catalog,
task template, test strategy, or project memory has been updated.
