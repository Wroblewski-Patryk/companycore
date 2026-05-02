-- CreateTable
CREATE TABLE "integration_settings" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "secret_ciphertext" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_workspace_id_provider_key" ON "integration_settings"("workspace_id", "provider");

-- CreateIndex
CREATE INDEX "integration_settings_provider_idx" ON "integration_settings"("provider");

-- AddForeignKey
ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
