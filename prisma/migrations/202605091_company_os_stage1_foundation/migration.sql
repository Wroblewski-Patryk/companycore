-- CreateEnum
CREATE TYPE "OperatingStatus" AS ENUM ('draft', 'active', 'paused', 'archived', 'retired', 'deprecated');

-- CreateEnum
CREATE TYPE "CompanyRoleType" AS ENUM ('human', 'agent', 'system');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('manual', 'schedule', 'webhook', 'clickup_status_change', 'drive_file_created', 'github_push', 'n8n_webhook', 'agent_decision', 'system_event');

-- CreateEnum
CREATE TYPE "ProcedureStepType" AS ENUM ('manual', 'automated', 'agent', 'human_review', 'integration_call');

-- CreateEnum
CREATE TYPE "AdapterProvider" AS ENUM ('clickup', 'google_drive', 'gmail', 'github', 'coolify', 'n8n', 'custom');

-- CreateEnum
CREATE TYPE "AdapterAuthType" AS ENUM ('api_key', 'oauth', 'webhook_secret', 'service_account', 'none', 'custom');

-- CreateEnum
CREATE TYPE "AdapterConnectionStatus" AS ENUM ('configured', 'connected', 'degraded', 'disconnected', 'blocked');

-- CreateEnum
CREATE TYPE "AdapterHealthStatus" AS ENUM ('unknown', 'healthy', 'degraded', 'failed');

-- CreateTable
CREATE TABLE "company_roles" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompanyRoleType" NOT NULL DEFAULT 'agent',
    "responsibilities" JSONB NOT NULL DEFAULT '[]',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "allowed_tools" JSONB NOT NULL DEFAULT '[]',
    "escalation_target_id" UUID,
    "default_policies" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_role_id" UUID,
    "department" TEXT,
    "category" TEXT,
    "status" "OperatingStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "maturity_level" TEXT NOT NULL DEFAULT 'initial',
    "related_policies" JSONB NOT NULL DEFAULT '[]',
    "related_metrics" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "process_id" UUID,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "trigger_type" "TriggerType" NOT NULL DEFAULT 'manual',
    "input_schema" JSONB NOT NULL DEFAULT '{}',
    "output_schema" JSONB NOT NULL DEFAULT '{}',
    "default_owner_role_id" UUID,
    "status" "OperatingStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_automatable" BOOLEAN NOT NULL DEFAULT false,
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standards" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "checklist_id" UUID,
    "validation_method" TEXT,
    "owner_role_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedures" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "process_id" UUID,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT,
    "owner_role_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "OperatingStatus" NOT NULL DEFAULT 'draft',
    "required_tools" JSONB NOT NULL DEFAULT '[]',
    "required_permissions" JSONB NOT NULL DEFAULT '[]',
    "expected_result" TEXT,
    "quality_standard_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_adapters" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "provider" "AdapterProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "auth_type" "AdapterAuthType" NOT NULL,
    "connection_status" "AdapterConnectionStatus" NOT NULL DEFAULT 'disconnected',
    "rate_limit_info" JSONB NOT NULL DEFAULT '{}',
    "last_sync_at" TIMESTAMP(3),
    "config_schema" JSONB NOT NULL DEFAULT '{}',
    "health_status" "AdapterHealthStatus" NOT NULL DEFAULT 'unknown',
    "owner_role_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_adapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_capabilities" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "tool_adapter_id" UUID NOT NULL,
    "capability_key" TEXT NOT NULL,
    "required_permissions" JSONB NOT NULL DEFAULT '[]',
    "input_schema" JSONB NOT NULL DEFAULT '{}',
    "output_schema" JSONB NOT NULL DEFAULT '{}',
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'medium',
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "audit_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_steps" (
    "id" UUID NOT NULL,
    "procedure_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "step_type" "ProcedureStepType" NOT NULL DEFAULT 'manual',
    "required_tool_adapter_id" UUID,
    "expected_input" JSONB NOT NULL DEFAULT '{}',
    "expected_output" JSONB NOT NULL DEFAULT '{}',
    "validation_rule" JSONB NOT NULL DEFAULT '{}',
    "rollback_instruction" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedure_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "external_provider" TEXT,
    "external_id" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "owner_role_id" UUID,
    "access_level" TEXT NOT NULL DEFAULT 'workspace',
    "related_project_id" UUID,
    "related_process_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "pipeline_stages" ADD COLUMN "pipeline_id" UUID,
ADD COLUMN "description" TEXT,
ADD COLUMN "expected_input" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "expected_output" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "entry_conditions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "exit_conditions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "assigned_role_id" UUID,
ADD COLUMN "procedure_id" UUID,
ADD COLUMN "required_tools" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "required_approvals" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "estimated_duration" TEXT,
ADD COLUMN "failure_strategy" TEXT,
ADD COLUMN "retry_policy" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "pipeline_stages" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "pipeline_stages" ALTER COLUMN "status" TYPE "OperatingStatus" USING "status"::"OperatingStatus";
ALTER TABLE "pipeline_stages" ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "company_roles_workspace_id_name_key" ON "company_roles"("workspace_id", "name");
CREATE INDEX "company_roles_workspace_id_type_idx" ON "company_roles"("workspace_id", "type");
CREATE UNIQUE INDEX "processes_workspace_id_name_key" ON "processes"("workspace_id", "name");
CREATE INDEX "processes_workspace_id_status_idx" ON "processes"("workspace_id", "status");
CREATE INDEX "processes_workspace_id_department_idx" ON "processes"("workspace_id", "department");
CREATE UNIQUE INDEX "pipelines_workspace_id_name_key" ON "pipelines"("workspace_id", "name");
CREATE INDEX "pipelines_workspace_id_status_idx" ON "pipelines"("workspace_id", "status");
CREATE INDEX "pipelines_workspace_id_process_id_idx" ON "pipelines"("workspace_id", "process_id");
CREATE UNIQUE INDEX "standards_workspace_id_name_version_key" ON "standards"("workspace_id", "name", "version");
CREATE UNIQUE INDEX "procedures_workspace_id_name_version_key" ON "procedures"("workspace_id", "name", "version");
CREATE INDEX "procedures_workspace_id_status_idx" ON "procedures"("workspace_id", "status");
CREATE INDEX "procedures_workspace_id_process_id_idx" ON "procedures"("workspace_id", "process_id");
CREATE UNIQUE INDEX "tool_adapters_workspace_id_provider_key" ON "tool_adapters"("workspace_id", "provider");
CREATE INDEX "tool_adapters_workspace_id_connection_status_idx" ON "tool_adapters"("workspace_id", "connection_status");
CREATE UNIQUE INDEX "integration_capabilities_tool_adapter_id_capability_key_key" ON "integration_capabilities"("tool_adapter_id", "capability_key");
CREATE INDEX "integration_capabilities_workspace_id_capability_key_idx" ON "integration_capabilities"("workspace_id", "capability_key");
CREATE UNIQUE INDEX "procedure_steps_procedure_id_step_order_key" ON "procedure_steps"("procedure_id", "step_order");
CREATE INDEX "procedure_steps_procedure_id_idx" ON "procedure_steps"("procedure_id");
CREATE UNIQUE INDEX "resources_workspace_id_external_provider_external_id_key" ON "resources"("workspace_id", "external_provider", "external_id");
CREATE INDEX "resources_workspace_id_type_idx" ON "resources"("workspace_id", "type");
CREATE INDEX "resources_workspace_id_related_project_id_idx" ON "resources"("workspace_id", "related_project_id");
CREATE INDEX "resources_workspace_id_related_process_id_idx" ON "resources"("workspace_id", "related_process_id");
CREATE UNIQUE INDEX "pipeline_stages_pipeline_id_position_key" ON "pipeline_stages"("pipeline_id", "position");
CREATE INDEX "pipeline_stages_workspace_id_pipeline_id_idx" ON "pipeline_stages"("workspace_id", "pipeline_id");
CREATE INDEX "pipeline_stages_workspace_id_status_idx" ON "pipeline_stages"("workspace_id", "status");

-- AddForeignKey
ALTER TABLE "company_roles" ADD CONSTRAINT "company_roles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_roles" ADD CONSTRAINT "company_roles_escalation_target_id_fkey" FOREIGN KEY ("escalation_target_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "processes" ADD CONSTRAINT "processes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "processes" ADD CONSTRAINT "processes_owner_role_id_fkey" FOREIGN KEY ("owner_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_default_owner_role_id_fkey" FOREIGN KEY ("default_owner_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "standards" ADD CONSTRAINT "standards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "standards" ADD CONSTRAINT "standards_owner_role_id_fkey" FOREIGN KEY ("owner_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_owner_role_id_fkey" FOREIGN KEY ("owner_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_quality_standard_id_fkey" FOREIGN KEY ("quality_standard_id") REFERENCES "standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tool_adapters" ADD CONSTRAINT "tool_adapters_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tool_adapters" ADD CONSTRAINT "tool_adapters_owner_role_id_fkey" FOREIGN KEY ("owner_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "integration_capabilities" ADD CONSTRAINT "integration_capabilities_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_capabilities" ADD CONSTRAINT "integration_capabilities_tool_adapter_id_fkey" FOREIGN KEY ("tool_adapter_id") REFERENCES "tool_adapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedure_steps" ADD CONSTRAINT "procedure_steps_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "procedures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedure_steps" ADD CONSTRAINT "procedure_steps_required_tool_adapter_id_fkey" FOREIGN KEY ("required_tool_adapter_id") REFERENCES "tool_adapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_owner_role_id_fkey" FOREIGN KEY ("owner_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_related_project_id_fkey" FOREIGN KEY ("related_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_related_process_id_fkey" FOREIGN KEY ("related_process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_assigned_role_id_fkey" FOREIGN KEY ("assigned_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
