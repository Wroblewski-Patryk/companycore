# Integrations

Integration modules live here when CompanyCore calls external services
directly. ClickUp is the first native v1 adapter and should establish the
reusable pattern for future integrations.

Required adapter layers:

- workspace settings reader
- provider client
- provider mapper
- sync service
- safe error mapper

Adapters must derive provider credentials from workspace-owned integration
settings, never from provider-specific process env values. Secrets are decrypted
inside the backend process and must not be logged, returned through API
responses, or embedded in events.

External records must be idempotent by `(workspace_id, source, external_id)`.
For ClickUp tasks, use `source = clickup` and the ClickUp task ID as
`external_id`.
