ALTER TABLE "task_lists" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "pipeline_stages" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "interactions" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "notes" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "decisions" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
