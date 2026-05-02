-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN "key_hash" TEXT;
ALTER TABLE "api_keys" ADD COLUMN "key_prefix" TEXT;
ALTER TABLE "api_keys" ADD COLUMN "scopes" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
