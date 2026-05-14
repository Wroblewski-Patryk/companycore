DROP INDEX IF EXISTS "processes_workspace_id_name_key";
DROP INDEX IF EXISTS "pipelines_workspace_id_name_key";

CREATE UNIQUE INDEX "processes_workspace_id_name_version_key"
  ON "processes"("workspace_id", "name", "version");

CREATE UNIQUE INDEX "pipelines_workspace_id_name_version_key"
  ON "pipelines"("workspace_id", "name", "version");
