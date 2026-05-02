-- AlterTable
ALTER TABLE "decisions" ADD COLUMN "workspace_id" UUID;

-- AlterTable
ALTER TABLE "agent_logs" ADD COLUMN "workspace_id" UUID;

-- CreateIndex
CREATE INDEX "decisions_workspace_id_idx" ON "decisions"("workspace_id");

-- CreateIndex
CREATE INDEX "agent_logs_workspace_id_idx" ON "agent_logs"("workspace_id");

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
