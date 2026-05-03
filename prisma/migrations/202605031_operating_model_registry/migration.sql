-- CreateTable
CREATE TABLE "operating_areas" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_folders" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'companycore',
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_tables" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "folder_id" UUID,
    "table_name" TEXT NOT NULL,
    "api_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'companycore',
    "external_id" TEXT,
    "sync_policy" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_container_mappings" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT,
    "area_id" UUID,
    "folder_id" UUID,
    "table_id" UUID,
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_container_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_field_mappings" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field_type" TEXT,
    "table_id" UUID,
    "native_field" TEXT,
    "type_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_field_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_locations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "area_id" UUID,
    "folder_id" UUID,
    "table_id" UUID,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locator" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_roots" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "area_id" UUID,
    "folder_id" UUID,
    "table_id" UUID,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locator" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_roots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_definitions" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "area_id" UUID,
    "folder_id" UUID,
    "table_id" UUID,
    "provider" TEXT,
    "trigger_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "last_run_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operating_areas_workspace_id_key_key" ON "operating_areas"("workspace_id", "key");
CREATE INDEX "operating_areas_workspace_id_position_idx" ON "operating_areas"("workspace_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "operating_folders_workspace_id_key_key" ON "operating_folders"("workspace_id", "key");
CREATE UNIQUE INDEX "operating_folders_workspace_id_source_external_id_key" ON "operating_folders"("workspace_id", "source", "external_id");
CREATE INDEX "operating_folders_workspace_id_area_id_idx" ON "operating_folders"("workspace_id", "area_id");

-- CreateIndex
CREATE UNIQUE INDEX "operating_tables_workspace_id_api_slug_key" ON "operating_tables"("workspace_id", "api_slug");
CREATE UNIQUE INDEX "operating_tables_workspace_id_table_name_key" ON "operating_tables"("workspace_id", "table_name");
CREATE UNIQUE INDEX "operating_tables_workspace_id_source_external_id_key" ON "operating_tables"("workspace_id", "source", "external_id");
CREATE INDEX "operating_tables_workspace_id_area_id_idx" ON "operating_tables"("workspace_id", "area_id");
CREATE INDEX "operating_tables_workspace_id_folder_id_idx" ON "operating_tables"("workspace_id", "folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_container_mappings_workspace_id_provider_entity_type_external_id_key" ON "external_container_mappings"("workspace_id", "provider", "entity_type", "external_id");
CREATE INDEX "external_container_mappings_workspace_id_provider_entity_type_idx" ON "external_container_mappings"("workspace_id", "provider", "entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "external_field_mappings_workspace_id_provider_external_id_key" ON "external_field_mappings"("workspace_id", "provider", "external_id");
CREATE INDEX "external_field_mappings_workspace_id_provider_idx" ON "external_field_mappings"("workspace_id", "provider");

-- CreateIndex
CREATE INDEX "storage_locations_workspace_id_provider_idx" ON "storage_locations"("workspace_id", "provider");
CREATE INDEX "knowledge_roots_workspace_id_provider_idx" ON "knowledge_roots"("workspace_id", "provider");
CREATE INDEX "automation_definitions_workspace_id_provider_idx" ON "automation_definitions"("workspace_id", "provider");

-- AddForeignKey
ALTER TABLE "operating_areas" ADD CONSTRAINT "operating_areas_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operating_folders" ADD CONSTRAINT "operating_folders_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operating_folders" ADD CONSTRAINT "operating_folders_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "operating_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operating_tables" ADD CONSTRAINT "operating_tables_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operating_tables" ADD CONSTRAINT "operating_tables_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "operating_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operating_tables" ADD CONSTRAINT "operating_tables_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "operating_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "external_container_mappings" ADD CONSTRAINT "external_container_mappings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_container_mappings" ADD CONSTRAINT "external_container_mappings_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "operating_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "external_container_mappings" ADD CONSTRAINT "external_container_mappings_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "operating_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "external_container_mappings" ADD CONSTRAINT "external_container_mappings_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "operating_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "external_field_mappings" ADD CONSTRAINT "external_field_mappings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_field_mappings" ADD CONSTRAINT "external_field_mappings_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "operating_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "operating_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "operating_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "operating_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_roots" ADD CONSTRAINT "knowledge_roots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_roots" ADD CONSTRAINT "knowledge_roots_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "operating_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_roots" ADD CONSTRAINT "knowledge_roots_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "operating_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_roots" ADD CONSTRAINT "knowledge_roots_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "operating_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "automation_definitions" ADD CONSTRAINT "automation_definitions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_definitions" ADD CONSTRAINT "automation_definitions_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "operating_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "automation_definitions" ADD CONSTRAINT "automation_definitions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "operating_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "automation_definitions" ADD CONSTRAINT "automation_definitions_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "operating_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill approved operating areas and first-party API tables for existing workspaces.
WITH area_catalog(key, name, position) AS (
    VALUES
    ('strategy-governance', 'Strategy and governance', 1),
    ('projects-delivery', 'Projects and delivery', 2),
    ('tasks-workflow', 'Tasks and workflow', 3),
    ('sales-crm', 'Sales and CRM', 4),
    ('marketing-growth', 'Marketing and growth', 5),
    ('finance-billing', 'Finance and billing', 6),
    ('people-roles', 'People and roles', 7),
    ('operations-administration', 'Operations and administration', 8),
    ('knowledge-decisions', 'Knowledge and decisions', 9),
    ('assets-storage', 'Assets and storage', 10),
    ('automations-integrations', 'Automations and integrations', 11),
    ('ai-agents-observability', 'AI agents and observability', 12)
)
INSERT INTO "operating_areas" ("id", "workspace_id", "key", "name", "position", "created_at", "updated_at")
SELECT (
    substr(md5(w."id"::text || ':' || area_catalog.key), 1, 8) || '-' ||
    substr(md5(w."id"::text || ':' || area_catalog.key), 9, 4) || '-' ||
    substr(md5(w."id"::text || ':' || area_catalog.key), 13, 4) || '-' ||
    substr(md5(w."id"::text || ':' || area_catalog.key), 17, 4) || '-' ||
    substr(md5(w."id"::text || ':' || area_catalog.key), 21, 12)
)::uuid,
w."id",
area_catalog.key,
area_catalog.name,
area_catalog.position,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP
FROM "workspaces" w
CROSS JOIN area_catalog
ON CONFLICT ("workspace_id", "key") DO NOTHING;

WITH table_catalog(area_key, table_name, api_slug, name, description) AS (
    VALUES
    ('projects-delivery', 'projects', 'projects', 'Projects', 'Company projects and delivery containers'),
    ('strategy-governance', 'goals', 'goals', 'Goals', 'Strategic outcomes linked to projects'),
    ('strategy-governance', 'targets', 'targets', 'Targets', 'Measurable targets linked to goals'),
    ('tasks-workflow', 'task_lists', 'task-lists', 'Task lists', 'Task grouping layer equivalent to ClickUp Lists'),
    ('tasks-workflow', 'tasks', 'tasks', 'Tasks', 'Operational tasks imported from ClickUp or created natively'),
    ('sales-crm', 'clients', 'clients', 'Clients', 'CRM contacts and companies'),
    ('sales-crm', 'pipeline_stages', 'pipeline-stages', 'Pipeline stages', 'Sales pipeline configuration'),
    ('sales-crm', 'deals', 'deals', 'Deals', 'Sales opportunities'),
    ('sales-crm', 'interactions', 'interactions', 'Interactions', 'CRM timeline interactions'),
    ('knowledge-decisions', 'notes', 'notes', 'Notes', 'Durable operational notes'),
    ('knowledge-decisions', 'decisions', 'decisions', 'Decisions', 'Recorded decisions and rationale'),
    ('ai-agents-observability', 'agents', 'agents', 'Agents', 'AI agent identities'),
    ('ai-agents-observability', 'agent_logs', 'agent-logs', 'Agent logs', 'AI agent operational logs'),
    ('ai-agents-observability', 'events', 'events', 'Events', 'System events and sync signals')
)
INSERT INTO "operating_tables" ("id", "workspace_id", "area_id", "table_name", "api_slug", "name", "description", "source", "sync_policy", "created_at", "updated_at")
SELECT (
    substr(md5(w."id"::text || ':table:' || table_catalog.table_name), 1, 8) || '-' ||
    substr(md5(w."id"::text || ':table:' || table_catalog.table_name), 9, 4) || '-' ||
    substr(md5(w."id"::text || ':table:' || table_catalog.table_name), 13, 4) || '-' ||
    substr(md5(w."id"::text || ':table:' || table_catalog.table_name), 17, 4) || '-' ||
    substr(md5(w."id"::text || ':table:' || table_catalog.table_name), 21, 12)
)::uuid,
w."id",
oa."id",
table_catalog.table_name,
table_catalog.api_slug,
table_catalog.name,
table_catalog.description,
'companycore',
'{}'::jsonb,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP
FROM "workspaces" w
JOIN table_catalog ON true
JOIN "operating_areas" oa ON oa."workspace_id" = w."id" AND oa."key" = table_catalog.area_key
ON CONFLICT ("workspace_id", "api_slug") DO NOTHING;
