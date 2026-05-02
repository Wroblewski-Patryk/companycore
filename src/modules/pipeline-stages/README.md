# Pipeline Stages Module

The pipeline stages module exposes workspace-scoped list/create/update routes
for CRM pipeline configuration used by deals and service adapters.

Implemented routes:

- `GET /v1/pipeline-stages`
- `POST /v1/pipeline-stages`
- `PATCH /v1/pipeline-stages/:id`
- root compatibility aliases under `/pipeline-stages`

Seed data may create default stages for the bootstrap workspace. Delete is
intentionally deferred until retention behavior for related deals is explicitly
approved.
