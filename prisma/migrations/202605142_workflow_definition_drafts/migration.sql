CREATE TYPE "WorkflowDefinitionRootType" AS ENUM ('process', 'pipeline', 'procedure');

CREATE TABLE "workflow_definition_drafts" (
  "id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "root_object_type" "WorkflowDefinitionRootType" NOT NULL,
  "root_object_id" UUID,
  "name" TEXT NOT NULL,
  "reason" TEXT,
  "status" "OperatingStatus" NOT NULL DEFAULT 'draft',
  "risk_level" "RiskLevel" NOT NULL DEFAULT 'medium',
  "base_version" INTEGER,
  "target_version" INTEGER,
  "change_set" JSONB NOT NULL DEFAULT '{}',
  "impact_preview" JSONB NOT NULL DEFAULT '{}',
  "idempotency_key" TEXT,
  "actor_type" "ActorType" NOT NULL DEFAULT 'user',
  "actor_id" TEXT,
  "source_channel" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "workflow_definition_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workflow_definition_drafts_workspace_id_idempotency_key_key"
  ON "workflow_definition_drafts"("workspace_id", "idempotency_key");

CREATE INDEX "workflow_definition_drafts_workspace_id_root_object_type_status_idx"
  ON "workflow_definition_drafts"("workspace_id", "root_object_type", "status");

CREATE INDEX "workflow_definition_drafts_workspace_id_root_object_id_idx"
  ON "workflow_definition_drafts"("workspace_id", "root_object_id");

ALTER TABLE "workflow_definition_drafts"
  ADD CONSTRAINT "workflow_definition_drafts_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
