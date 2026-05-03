-- CreateTable
CREATE TABLE "google_drive_files" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google_drive',
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "drive_id" TEXT,
    "parent_external_id" TEXT,
    "is_folder" BOOLEAN NOT NULL DEFAULT false,
    "trashed" BOOLEAN NOT NULL DEFAULT false,
    "web_view_link" TEXT,
    "web_content_link" TEXT,
    "icon_link" TEXT,
    "thumbnail_link" TEXT,
    "size" TEXT,
    "head_revision_id" TEXT,
    "md5_checksum" TEXT,
    "modified_time" TIMESTAMP(3),
    "operating_area_id" UUID,
    "operating_folder_id" UUID,
    "operating_table_id" UUID,
    "storage_location_id" UUID,
    "knowledge_root_id" UUID,
    "sync_status" TEXT NOT NULL DEFAULT 'pending',
    "scan_status" TEXT NOT NULL DEFAULT 'not_scanned',
    "last_synced_at" TIMESTAMP(3),
    "last_scanned_at" TIMESTAMP(3),
    "raw_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_drive_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_drive_content_snapshots" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "google_drive_file_id" UUID NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "content_kind" TEXT NOT NULL,
    "extracted_text" TEXT,
    "structured_preview" JSONB,
    "summary" TEXT,
    "scan_status" TEXT NOT NULL DEFAULT 'completed',
    "error_code" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_drive_content_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_drive_files_workspace_id_provider_external_id_key" ON "google_drive_files"("workspace_id", "provider", "external_id");
CREATE INDEX "google_drive_files_workspace_id_parent_external_id_idx" ON "google_drive_files"("workspace_id", "parent_external_id");
CREATE INDEX "google_drive_files_workspace_id_is_folder_idx" ON "google_drive_files"("workspace_id", "is_folder");
CREATE INDEX "google_drive_files_workspace_id_operating_area_id_idx" ON "google_drive_files"("workspace_id", "operating_area_id");
CREATE INDEX "google_drive_files_workspace_id_operating_folder_id_idx" ON "google_drive_files"("workspace_id", "operating_folder_id");
CREATE INDEX "google_drive_files_workspace_id_operating_table_id_idx" ON "google_drive_files"("workspace_id", "operating_table_id");
CREATE INDEX "google_drive_files_workspace_id_storage_location_id_idx" ON "google_drive_files"("workspace_id", "storage_location_id");
CREATE INDEX "google_drive_files_workspace_id_knowledge_root_id_idx" ON "google_drive_files"("workspace_id", "knowledge_root_id");
CREATE UNIQUE INDEX "google_drive_content_snapshots_google_drive_file_id_source_revision_id_key" ON "google_drive_content_snapshots"("google_drive_file_id", "source_revision_id");
CREATE INDEX "google_drive_content_snapshots_workspace_id_content_kind_idx" ON "google_drive_content_snapshots"("workspace_id", "content_kind");
CREATE INDEX "google_drive_content_snapshots_workspace_id_scan_status_idx" ON "google_drive_content_snapshots"("workspace_id", "scan_status");

-- AddForeignKey
ALTER TABLE "google_drive_files" ADD CONSTRAINT "google_drive_files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "google_drive_files" ADD CONSTRAINT "google_drive_files_operating_area_id_fkey" FOREIGN KEY ("operating_area_id") REFERENCES "operating_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "google_drive_files" ADD CONSTRAINT "google_drive_files_operating_folder_id_fkey" FOREIGN KEY ("operating_folder_id") REFERENCES "operating_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "google_drive_files" ADD CONSTRAINT "google_drive_files_operating_table_id_fkey" FOREIGN KEY ("operating_table_id") REFERENCES "operating_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "google_drive_files" ADD CONSTRAINT "google_drive_files_storage_location_id_fkey" FOREIGN KEY ("storage_location_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "google_drive_files" ADD CONSTRAINT "google_drive_files_knowledge_root_id_fkey" FOREIGN KEY ("knowledge_root_id") REFERENCES "knowledge_roots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "google_drive_content_snapshots" ADD CONSTRAINT "google_drive_content_snapshots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "google_drive_content_snapshots" ADD CONSTRAINT "google_drive_content_snapshots_google_drive_file_id_fkey" FOREIGN KEY ("google_drive_file_id") REFERENCES "google_drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
