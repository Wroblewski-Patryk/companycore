-- Add workspace ownership to core business records.
ALTER TABLE "projects" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "goals" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "targets" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "task_lists" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "clients" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "pipeline_stages" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "deals" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "interactions" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "notes" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "agents" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "events" ADD COLUMN "workspace_id" UUID;

CREATE INDEX "projects_workspace_id_idx" ON "projects"("workspace_id");
CREATE INDEX "goals_workspace_id_idx" ON "goals"("workspace_id");
CREATE INDEX "targets_workspace_id_idx" ON "targets"("workspace_id");
CREATE INDEX "task_lists_workspace_id_idx" ON "task_lists"("workspace_id");
CREATE INDEX "clients_workspace_id_idx" ON "clients"("workspace_id");
CREATE INDEX "pipeline_stages_workspace_id_idx" ON "pipeline_stages"("workspace_id");
CREATE INDEX "deals_workspace_id_idx" ON "deals"("workspace_id");
CREATE INDEX "interactions_workspace_id_idx" ON "interactions"("workspace_id");
CREATE INDEX "notes_workspace_id_idx" ON "notes"("workspace_id");
CREATE INDEX "agents_workspace_id_idx" ON "agents"("workspace_id");
CREATE INDEX "events_workspace_id_idx" ON "events"("workspace_id");

ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "targets" ADD CONSTRAINT "targets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_lists" ADD CONSTRAINT "task_lists_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deals" ADD CONSTRAINT "deals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agents" ADD CONSTRAINT "agents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
