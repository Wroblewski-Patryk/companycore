-- DropIndex
DROP INDEX "tasks_source_external_id_key";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "workspace_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "tasks_workspace_id_source_external_id_key" ON "tasks"("workspace_id", "source", "external_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
