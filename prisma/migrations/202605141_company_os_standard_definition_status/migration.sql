ALTER TABLE "standards" ADD COLUMN "status" "OperatingStatus" NOT NULL DEFAULT 'active';

CREATE INDEX "standards_workspace_id_status_idx" ON "standards"("workspace_id", "status");
