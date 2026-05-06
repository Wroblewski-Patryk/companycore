ALTER TABLE "operating_areas" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

UPDATE "operating_areas"
SET "is_system" = true
WHERE "key" IN (
  'main-general',
  'strategy-governance',
  'projects-delivery',
  'tasks-workflow',
  'sales-crm',
  'marketing-growth',
  'finance-billing',
  'people-roles',
  'operations-administration',
  'knowledge-decisions',
  'assets-storage',
  'automations-integrations',
  'ai-agents-observability'
);
