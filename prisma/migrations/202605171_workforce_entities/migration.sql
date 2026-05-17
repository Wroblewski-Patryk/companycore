CREATE TYPE "WorkforceEntityType" AS ENUM ('human', 'agent');
CREATE TYPE "WorkforceEntityStatus" AS ENUM ('active', 'inactive', 'paused', 'archived');
CREATE TYPE "WorkforceRuntimeMode" AS ENUM ('manual', 'semi_autonomous', 'autonomous');
CREATE TYPE "WorkforcePersonalityProfile" AS ENUM ('analytical', 'creative', 'executive', 'supportive', 'researcher', 'custom');

CREATE TABLE "workforce_entities" (
  "id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "type" "WorkforceEntityType" NOT NULL,
  "status" "WorkforceEntityStatus" NOT NULL DEFAULT 'active',
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "avatar" TEXT,
  "department" TEXT,
  "role" TEXT,
  "manager_id" UUID,
  "personality_profile" "WorkforcePersonalityProfile" NOT NULL DEFAULT 'supportive',
  "model" TEXT,
  "runtime_mode" "WorkforceRuntimeMode" NOT NULL DEFAULT 'manual',
  "paperclip_agent_id" TEXT,
  "synchronization_enabled" BOOLEAN NOT NULL DEFAULT false,
  "generated_files" JSONB NOT NULL DEFAULT '{}',
  "sync_status" TEXT NOT NULL DEFAULT 'not_synced',
  "sync_log" JSONB NOT NULL DEFAULT '[]',
  "last_synced_at" TIMESTAMP(3),
  "source" TEXT NOT NULL DEFAULT 'companycore',
  "external_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workforce_entities_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "workforce_entities"
  ADD CONSTRAINT "workforce_entities_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workforce_entities"
  ADD CONSTRAINT "workforce_entities_manager_id_fkey"
  FOREIGN KEY ("manager_id") REFERENCES "workforce_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "workforce_entities_workspace_id_slug_key" ON "workforce_entities"("workspace_id", "slug");
CREATE UNIQUE INDEX "workforce_entities_workspace_id_source_external_id_key" ON "workforce_entities"("workspace_id", "source", "external_id");
CREATE INDEX "workforce_entities_workspace_id_type_idx" ON "workforce_entities"("workspace_id", "type");
CREATE INDEX "workforce_entities_workspace_id_status_idx" ON "workforce_entities"("workspace_id", "status");
CREATE INDEX "workforce_entities_workspace_id_department_idx" ON "workforce_entities"("workspace_id", "department");
CREATE INDEX "workforce_entities_workspace_id_manager_id_idx" ON "workforce_entities"("workspace_id", "manager_id");

INSERT INTO "workforce_entities" (
  "id",
  "workspace_id",
  "type",
  "status",
  "name",
  "slug",
  "department",
  "role",
  "personality_profile",
  "runtime_mode",
  "synchronization_enabled",
  "generated_files",
  "sync_status",
  "sync_log",
  "source",
  "external_id",
  "created_at",
  "updated_at"
)
SELECT
  md5(wm."workspace_id"::text || ':' || u."id"::text || ':human')::uuid,
  wm."workspace_id",
  'human'::"WorkforceEntityType",
  'active'::"WorkforceEntityStatus",
  COALESCE(u."name", u."email"),
  lower(regexp_replace(COALESCE(u."name", split_part(u."email", '@', 1)), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(u."id"::text, 8),
  '06-kadry',
  'Owner',
  'executive'::"WorkforcePersonalityProfile",
  'manual'::"WorkforceRuntimeMode",
  false,
  '{}'::jsonb,
  'not_synced',
  '[]'::jsonb,
  'user',
  u."id"::text,
  NOW(),
  NOW()
FROM "users" u
JOIN "workspace_memberships" wm ON wm."user_id" = u."id"
ON CONFLICT ("workspace_id", "source", "external_id") DO NOTHING;

INSERT INTO "workforce_entities" (
  "id",
  "workspace_id",
  "type",
  "status",
  "name",
  "slug",
  "department",
  "role",
  "personality_profile",
  "runtime_mode",
  "paperclip_agent_id",
  "synchronization_enabled",
  "generated_files",
  "sync_status",
  "sync_log",
  "source",
  "external_id",
  "created_at",
  "updated_at"
)
SELECT
  md5(a."workspace_id"::text || ':' || a."id"::text || ':agent')::uuid,
  a."workspace_id",
  'agent'::"WorkforceEntityType",
  CASE WHEN a."status" = 'retired' THEN 'archived'::"WorkforceEntityStatus" WHEN a."status" = 'paused' THEN 'paused'::"WorkforceEntityStatus" ELSE 'active'::"WorkforceEntityStatus" END,
  a."name",
  lower(regexp_replace(a."name", '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(a."id"::text, 8),
  '06-kadry',
  a."role",
  'supportive'::"WorkforcePersonalityProfile",
  'semi_autonomous'::"WorkforceRuntimeMode",
  COALESCE(a."external_id", a."id"::text),
  true,
  '{}'::jsonb,
  'not_synced',
  '[]'::jsonb,
  'agent',
  a."id"::text,
  a."created_at",
  a."updated_at"
FROM "agents" a
WHERE a."workspace_id" IS NOT NULL
ON CONFLICT ("workspace_id", "source", "external_id") DO NOTHING;
