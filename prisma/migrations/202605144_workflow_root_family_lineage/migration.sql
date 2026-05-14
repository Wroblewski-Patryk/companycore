ALTER TABLE "processes" ADD COLUMN "family_id" UUID;
ALTER TABLE "pipelines" ADD COLUMN "family_id" UUID;
ALTER TABLE "procedures" ADD COLUMN "family_id" UUID;

UPDATE "processes" SET "family_id" = "id" WHERE "family_id" IS NULL;
UPDATE "pipelines" SET "family_id" = "id" WHERE "family_id" IS NULL;
UPDATE "procedures" SET "family_id" = "id" WHERE "family_id" IS NULL;

ALTER TABLE "processes" ALTER COLUMN "family_id" SET NOT NULL;
ALTER TABLE "pipelines" ALTER COLUMN "family_id" SET NOT NULL;
ALTER TABLE "procedures" ALTER COLUMN "family_id" SET NOT NULL;

CREATE INDEX "processes_workspace_id_family_id_status_idx"
  ON "processes"("workspace_id", "family_id", "status");

CREATE INDEX "pipelines_workspace_id_family_id_status_idx"
  ON "pipelines"("workspace_id", "family_id", "status");

CREATE INDEX "procedures_workspace_id_family_id_status_idx"
  ON "procedures"("workspace_id", "family_id", "status");
