-- CreateEnum
CREATE TYPE "EnforcementMode" AS ENUM ('soft_warning', 'block', 'require_approval', 'log_only');

-- CreateEnum
CREATE TYPE "AutomationRuleStatus" AS ENUM ('draft', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "DependencyStatus" AS ENUM ('active', 'blocked', 'resolved', 'archived');

-- CreateTable
CREATE TABLE "policies" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "applies_to" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "severity" "RiskLevel" NOT NULL DEFAULT 'medium',
    "enforcement_mode" "EnforcementMode" NOT NULL DEFAULT 'soft_warning',
    "escalation_role_id" UUID,
    "process_id" UUID,
    "procedure_id" UUID,
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "measurement_type" TEXT NOT NULL,
    "unit" TEXT,
    "target_value" DOUBLE PRECISION,
    "current_value" DOUBLE PRECISION,
    "calculation" JSONB NOT NULL DEFAULT '{}',
    "owner_role_id" UUID,
    "process_id" UUID,
    "pipeline_id" UUID,
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risks" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'medium',
    "likelihood" TEXT,
    "impact" TEXT,
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "process_id" UUID,
    "pipeline_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controls" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "risk_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "control_type" TEXT NOT NULL,
    "owner_role_id" UUID,
    "verification_method" TEXT,
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_items" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "summary" TEXT,
    "source_provider" TEXT,
    "source_external_id" TEXT,
    "url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "process_id" UUID,
    "pipeline_id" UUID,
    "project_id" UUID,
    "client_id" UUID,
    "agent_id" UUID,
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_logs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "context" TEXT NOT NULL,
    "options_considered" JSONB NOT NULL DEFAULT '[]',
    "chosen_option" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "decided_by_type" "ActorType" NOT NULL,
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "project_id" UUID,
    "process_id" UUID,
    "pipeline_id" UUID,
    "consequences" TEXT,
    "review_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pipeline_id" UUID,
    "condition" JSONB NOT NULL DEFAULT '{}',
    "action" JSONB NOT NULL DEFAULT '{}',
    "status" "AutomationRuleStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triggers" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "automation_rule_id" UUID,
    "source_type" "TriggerType" NOT NULL,
    "source_provider" TEXT,
    "event_type" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "artifact_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource_id" UUID,
    "url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependencies" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "dependency_type" TEXT NOT NULL,
    "from_resource_id" UUID,
    "to_resource_id" UUID,
    "from_entity_type" TEXT,
    "from_entity_id" TEXT,
    "to_entity_type" TEXT,
    "to_entity_id" TEXT,
    "status" "DependencyStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_functions" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "accountable_role_id" UUID,
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stakeholders" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "client_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "policies_workspace_id_applies_to_idx" ON "policies"("workspace_id", "applies_to");

-- CreateIndex
CREATE INDEX "policies_workspace_id_enforcement_mode_idx" ON "policies"("workspace_id", "enforcement_mode");

-- CreateIndex
CREATE UNIQUE INDEX "policies_workspace_id_name_key" ON "policies"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "metrics_workspace_id_category_idx" ON "metrics"("workspace_id", "category");

-- CreateIndex
CREATE INDEX "metrics_workspace_id_process_id_idx" ON "metrics"("workspace_id", "process_id");

-- CreateIndex
CREATE INDEX "metrics_workspace_id_pipeline_id_idx" ON "metrics"("workspace_id", "pipeline_id");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_workspace_id_name_key" ON "metrics"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "risks_workspace_id_risk_level_idx" ON "risks"("workspace_id", "risk_level");

-- CreateIndex
CREATE INDEX "risks_workspace_id_process_id_idx" ON "risks"("workspace_id", "process_id");

-- CreateIndex
CREATE INDEX "risks_workspace_id_pipeline_id_idx" ON "risks"("workspace_id", "pipeline_id");

-- CreateIndex
CREATE UNIQUE INDEX "risks_workspace_id_name_key" ON "risks"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "controls_workspace_id_risk_id_idx" ON "controls"("workspace_id", "risk_id");

-- CreateIndex
CREATE INDEX "controls_workspace_id_control_type_idx" ON "controls"("workspace_id", "control_type");

-- CreateIndex
CREATE UNIQUE INDEX "controls_workspace_id_name_key" ON "controls"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "knowledge_items_workspace_id_item_type_idx" ON "knowledge_items"("workspace_id", "item_type");

-- CreateIndex
CREATE INDEX "knowledge_items_workspace_id_process_id_idx" ON "knowledge_items"("workspace_id", "process_id");

-- CreateIndex
CREATE INDEX "knowledge_items_workspace_id_pipeline_id_idx" ON "knowledge_items"("workspace_id", "pipeline_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_items_workspace_id_source_provider_source_externa_key" ON "knowledge_items"("workspace_id", "source_provider", "source_external_id");

-- CreateIndex
CREATE INDEX "decision_logs_workspace_id_decided_at_idx" ON "decision_logs"("workspace_id", "decided_at");

-- CreateIndex
CREATE INDEX "decision_logs_workspace_id_process_id_idx" ON "decision_logs"("workspace_id", "process_id");

-- CreateIndex
CREATE INDEX "decision_logs_workspace_id_pipeline_id_idx" ON "decision_logs"("workspace_id", "pipeline_id");

-- CreateIndex
CREATE INDEX "automation_rules_workspace_id_status_idx" ON "automation_rules"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "automation_rules_workspace_id_pipeline_id_idx" ON "automation_rules"("workspace_id", "pipeline_id");

-- CreateIndex
CREATE UNIQUE INDEX "automation_rules_workspace_id_name_key" ON "automation_rules"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "triggers_workspace_id_source_type_status_idx" ON "triggers"("workspace_id", "source_type", "status");

-- CreateIndex
CREATE INDEX "triggers_workspace_id_automation_rule_id_idx" ON "triggers"("workspace_id", "automation_rule_id");

-- CreateIndex
CREATE INDEX "artifacts_workspace_id_artifact_type_idx" ON "artifacts"("workspace_id", "artifact_type");

-- CreateIndex
CREATE INDEX "artifacts_workspace_id_resource_id_idx" ON "artifacts"("workspace_id", "resource_id");

-- CreateIndex
CREATE INDEX "dependencies_workspace_id_dependency_type_status_idx" ON "dependencies"("workspace_id", "dependency_type", "status");

-- CreateIndex
CREATE INDEX "dependencies_workspace_id_from_resource_id_idx" ON "dependencies"("workspace_id", "from_resource_id");

-- CreateIndex
CREATE INDEX "dependencies_workspace_id_to_resource_id_idx" ON "dependencies"("workspace_id", "to_resource_id");

-- CreateIndex
CREATE INDEX "business_functions_workspace_id_category_idx" ON "business_functions"("workspace_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "business_functions_workspace_id_name_key" ON "business_functions"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "stakeholders_workspace_id_type_idx" ON "stakeholders"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "stakeholders_workspace_id_client_id_idx" ON "stakeholders"("workspace_id", "client_id");

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_escalation_role_id_fkey" FOREIGN KEY ("escalation_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_owner_role_id_fkey" FOREIGN KEY ("owner_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_owner_role_id_fkey" FOREIGN KEY ("owner_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_automation_rule_id_fkey" FOREIGN KEY ("automation_rule_id") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_from_resource_id_fkey" FOREIGN KEY ("from_resource_id") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_to_resource_id_fkey" FOREIGN KEY ("to_resource_id") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_functions" ADD CONSTRAINT "business_functions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_functions" ADD CONSTRAINT "business_functions_accountable_role_id_fkey" FOREIGN KEY ("accountable_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

