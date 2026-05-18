ALTER TABLE "workforce_entities"
  ADD COLUMN "hierarchy_level" TEXT,
  ADD COLUMN "big_five_profile" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "skill_index" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "knowledge_index" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "tool_index" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "authority_scope" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "paperclip_profile" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "workforce_entities_workspace_id_hierarchy_level_idx"
  ON "workforce_entities"("workspace_id", "hierarchy_level");
