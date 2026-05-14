-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('user', 'agent', 'system', 'integration');

-- CreateEnum
CREATE TYPE "PipelineRunStatus" AS ENUM ('pending', 'running', 'blocked', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "StageRunStatus" AS ENUM ('pending', 'running', 'blocked', 'completed', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('not_started', 'pending', 'passed', 'failed', 'waived');

-- CreateEnum
CREATE TYPE "ChecklistTargetType" AS ENUM ('task', 'pipeline_stage', 'procedure', 'pipeline_run', 'stage_run');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "actor_id" TEXT,
ADD COLUMN     "actor_type" "ActorType",
ADD COLUMN     "correlation_id" TEXT,
ADD COLUMN     "resource_id" TEXT,
ADD COLUMN     "resource_type" TEXT;

-- CreateTable
CREATE TABLE "pipeline_runs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "pipeline_id" UUID NOT NULL,
    "initiated_by_type" "ActorType" NOT NULL,
    "initiated_by_id" TEXT,
    "status" "PipelineRunStatus" NOT NULL DEFAULT 'pending',
    "current_stage_id" UUID,
    "input_payload" JSONB NOT NULL DEFAULT '{}',
    "output_payload" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_state" JSONB,
    "linked_task_ids" JSONB NOT NULL DEFAULT '[]',
    "linked_document_ids" JSONB NOT NULL DEFAULT '[]',
    "linked_client_id" UUID,
    "linked_project_id" UUID,
    "correlation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_runs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "pipeline_run_id" UUID NOT NULL,
    "pipeline_stage_id" UUID NOT NULL,
    "assigned_actor_type" "ActorType",
    "assigned_actor_id" TEXT,
    "status" "StageRunStatus" NOT NULL DEFAULT 'pending',
    "input_payload" JSONB NOT NULL DEFAULT '{}',
    "output_payload" JSONB NOT NULL DEFAULT '{}',
    "logs" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "validation_result" JSONB,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "requested_by_type" "ActorType" NOT NULL,
    "requested_by_id" TEXT,
    "requested_for_action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'medium',
    "approver_role_id" UUID,
    "approver_user_id" UUID,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "decision_reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "decided_at" TIMESTAMP(3),
    "pipeline_run_id" UUID,
    "stage_run_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_type" "ChecklistTargetType" NOT NULL,
    "status" "OperatingStatus" NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "checklist_template_id" UUID NOT NULL,
    "item_order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "verification_type" TEXT NOT NULL DEFAULT 'human_or_agent',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acceptance_criteria" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "checklist_item_id" UUID,
    "target_type" "ChecklistTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "validation_status" "VerificationStatus" NOT NULL DEFAULT 'not_started',
    "verified_by_type" "ActorType",
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "pipeline_run_id" UUID,
    "stage_run_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acceptance_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "tool_adapter_id" UUID,
    "input_payload" JSONB NOT NULL DEFAULT '{}',
    "output_payload" JSONB NOT NULL DEFAULT '{}',
    "approval_id" UUID,
    "error_state" JSONB,
    "pipeline_run_id" UUID,
    "stage_run_id" UUID,
    "correlation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipeline_runs_workspace_id_pipeline_id_status_idx" ON "pipeline_runs"("workspace_id", "pipeline_id", "status");

-- CreateIndex
CREATE INDEX "pipeline_runs_workspace_id_current_stage_id_idx" ON "pipeline_runs"("workspace_id", "current_stage_id");

-- CreateIndex
CREATE INDEX "pipeline_runs_workspace_id_linked_client_id_idx" ON "pipeline_runs"("workspace_id", "linked_client_id");

-- CreateIndex
CREATE INDEX "pipeline_runs_workspace_id_linked_project_id_idx" ON "pipeline_runs"("workspace_id", "linked_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_runs_workspace_id_correlation_id_key" ON "pipeline_runs"("workspace_id", "correlation_id");

-- CreateIndex
CREATE INDEX "stage_runs_workspace_id_status_idx" ON "stage_runs"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "stage_runs_workspace_id_pipeline_stage_id_idx" ON "stage_runs"("workspace_id", "pipeline_stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "stage_runs_pipeline_run_id_pipeline_stage_id_key" ON "stage_runs"("pipeline_run_id", "pipeline_stage_id");

-- CreateIndex
CREATE INDEX "approvals_workspace_id_status_expires_at_idx" ON "approvals"("workspace_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "approvals_workspace_id_resource_type_resource_id_idx" ON "approvals"("workspace_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "approvals_workspace_id_pipeline_run_id_idx" ON "approvals"("workspace_id", "pipeline_run_id");

-- CreateIndex
CREATE INDEX "checklist_templates_workspace_id_target_type_status_idx" ON "checklist_templates"("workspace_id", "target_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_templates_workspace_id_name_version_key" ON "checklist_templates"("workspace_id", "name", "version");

-- CreateIndex
CREATE INDEX "checklist_items_workspace_id_checklist_template_id_idx" ON "checklist_items"("workspace_id", "checklist_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_checklist_template_id_item_order_key" ON "checklist_items"("checklist_template_id", "item_order");

-- CreateIndex
CREATE INDEX "acceptance_criteria_workspace_id_target_type_target_id_idx" ON "acceptance_criteria"("workspace_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "acceptance_criteria_workspace_id_validation_status_idx" ON "acceptance_criteria"("workspace_id", "validation_status");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_actor_type_actor_id_idx" ON "audit_logs"("workspace_id", "actor_type", "actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_resource_type_resource_id_idx" ON "audit_logs"("workspace_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_correlation_id_idx" ON "audit_logs"("workspace_id", "correlation_id");

-- CreateIndex
CREATE INDEX "events_workspace_id_type_idx" ON "events"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "events_workspace_id_correlation_id_idx" ON "events"("workspace_id", "correlation_id");

-- CreateIndex
CREATE INDEX "events_workspace_id_resource_type_resource_id_idx" ON "events"("workspace_id", "resource_type", "resource_id");

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_linked_client_id_fkey" FOREIGN KEY ("linked_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_linked_project_id_fkey" FOREIGN KEY ("linked_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_runs" ADD CONSTRAINT "stage_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_runs" ADD CONSTRAINT "stage_runs_pipeline_run_id_fkey" FOREIGN KEY ("pipeline_run_id") REFERENCES "pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_runs" ADD CONSTRAINT "stage_runs_pipeline_stage_id_fkey" FOREIGN KEY ("pipeline_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_role_id_fkey" FOREIGN KEY ("approver_role_id") REFERENCES "company_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_pipeline_run_id_fkey" FOREIGN KEY ("pipeline_run_id") REFERENCES "pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_stage_run_id_fkey" FOREIGN KEY ("stage_run_id") REFERENCES "stage_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_template_id_fkey" FOREIGN KEY ("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_checklist_item_id_fkey" FOREIGN KEY ("checklist_item_id") REFERENCES "checklist_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_pipeline_run_id_fkey" FOREIGN KEY ("pipeline_run_id") REFERENCES "pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_stage_run_id_fkey" FOREIGN KEY ("stage_run_id") REFERENCES "stage_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tool_adapter_id_fkey" FOREIGN KEY ("tool_adapter_id") REFERENCES "tool_adapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_pipeline_run_id_fkey" FOREIGN KEY ("pipeline_run_id") REFERENCES "pipeline_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_stage_run_id_fkey" FOREIGN KEY ("stage_run_id") REFERENCES "stage_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

