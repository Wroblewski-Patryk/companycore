import { Router } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { resolveDepartmentEntry } from "../../operating-model/department-registry";

const OPERATIONS_DEPARTMENT_KEY = "04-operacje";
const OPERATIONS_LIMIT = 12;

function asJsonArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function taskLooksOperational(task: { title: string; description: string | null }) {
  const text = `${task.title} ${task.description ?? ""}`.toLowerCase();
  return ["operation", "operacje", "procedure", "procedura", "dependency", "approval", "routine", "sop"].some((term) => text.includes(term));
}

export const operationsRouter = Router();

operationsRouter.get("/context", asyncHandler(async (req, res) => {
  const workspaceId = req.auth!.workspaceId;
  const department = resolveDepartmentEntry(OPERATIONS_DEPARTMENT_KEY);

  const [
    procedures,
    procedureStepCount,
    approvals,
    dependencies,
    businessFunctions,
    tasks,
    counts
  ] = await Promise.all([
    prisma.procedure.findMany({
      where: { workspaceId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: OPERATIONS_LIMIT,
      include: {
        process: true,
        ownerRole: true,
        steps: { orderBy: { stepOrder: "asc" }, take: 8 }
      }
    }),
    prisma.procedureStep.count({ where: { procedure: { workspaceId } } }),
    prisma.approval.findMany({
      where: { workspaceId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: OPERATIONS_LIMIT,
      include: { approverRole: true }
    }),
    prisma.dependency.findMany({
      where: { workspaceId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: OPERATIONS_LIMIT,
      include: { fromResource: true, toResource: true }
    }),
    prisma.businessFunction.findMany({
      where: { workspaceId },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: OPERATIONS_LIMIT,
      include: { accountableRole: true }
    }),
    prisma.task.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      take: 50
    }),
    Promise.all([
      prisma.procedure.count({ where: { workspaceId } }),
      prisma.procedure.count({ where: { workspaceId, status: "active" } }),
      prisma.approval.count({ where: { workspaceId, status: "pending" } }),
      prisma.dependency.count({ where: { workspaceId, status: "blocked" } }),
      prisma.businessFunction.count({ where: { workspaceId, status: "active" } }),
      prisma.task.count({ where: { workspaceId, status: { in: ["todo", "in_progress", "blocked"] } } })
    ])
  ]);

  const operationalTasks = tasks.filter(taskLooksOperational).slice(0, OPERATIONS_LIMIT);
  const [procedureCount, activeProcedureCount, pendingApprovalCount, blockedDependencyCount, activeBusinessFunctionCount, openTaskCount] = counts;

  return res.json({
    data: {
      department: {
        canonicalKey: department?.canonicalKey ?? OPERATIONS_DEPARTMENT_KEY,
        backendAreaKey: department?.backendAreaKey ?? "operations-administration",
        name: "Operations Management System",
        purpose: "Keep the company running through planning, routines, controls, dependencies, approvals, and handoffs."
      },
      summary: {
        procedures: procedureCount,
        activeProcedures: activeProcedureCount,
        procedureSteps: procedureStepCount,
        pendingApprovals: pendingApprovalCount,
        blockedDependencies: blockedDependencyCount,
        activeBusinessFunctions: activeBusinessFunctionCount,
        openTasks: openTaskCount,
        operationalTasks: operationalTasks.length
      },
      procedures: procedures.map((procedure) => ({
        id: procedure.id,
        name: procedure.name,
        purpose: procedure.purpose,
        status: procedure.status,
        version: procedure.version,
        processName: procedure.process?.name ?? null,
        ownerRole: procedure.ownerRole?.name ?? null,
        requiredTools: asJsonArray(procedure.requiredTools),
        requiredPermissions: asJsonArray(procedure.requiredPermissions),
        expectedResult: procedure.expectedResult,
        steps: procedure.steps.map((step) => ({
          id: step.id,
          order: step.stepOrder,
          instruction: step.instruction,
          stepType: step.stepType,
          rollbackInstruction: step.rollbackInstruction
        }))
      })),
      approvals: approvals.map((approval) => ({
        id: approval.id,
        requestedByType: approval.requestedByType,
        requestedById: approval.requestedById,
        requestedForAction: approval.requestedForAction,
        resourceType: approval.resourceType,
        resourceId: approval.resourceId,
        riskLevel: approval.riskLevel,
        status: approval.status,
        approverRole: approval.approverRole?.name ?? null,
        expiresAt: approval.expiresAt?.toISOString() ?? null,
        createdAt: approval.createdAt.toISOString()
      })),
      dependencies: dependencies.map((dependency) => ({
        id: dependency.id,
        type: dependency.dependencyType,
        status: dependency.status,
        from: dependency.fromResource?.name ?? dependency.fromEntityType ?? null,
        to: dependency.toResource?.name ?? dependency.toEntityType ?? null,
        metadata: dependency.metadata
      })),
      businessFunctions: businessFunctions.map((businessFunction) => ({
        id: businessFunction.id,
        name: businessFunction.name,
        category: businessFunction.category,
        status: businessFunction.status,
        accountableRole: businessFunction.accountableRole?.name ?? null,
        description: businessFunction.description
      })),
      tasks: operationalTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() ?? null,
        source: task.source
      })),
      agentPacket: {
        mode: "read_only",
        recommendedNextActions: [
          "Review pending approvals before executing risky operations.",
          "Inspect blocked dependencies before assigning operational work.",
          "Use Company OS workflow-definition drafts for procedure changes.",
          "Create or update tasks only through existing task command routes."
        ],
        allowedActions: [
          "read_operations_context",
          "inspect_procedure",
          "inspect_dependency",
          "inspect_approval",
          "propose_task_follow_up"
        ],
        blockedActions: [
          {
            action: "create_or_change_procedure",
            reason: "Procedure definition changes must use Company OS workflow-definition draft commands."
          },
          {
            action: "decide_approval",
            reason: "Approval decisions require the dedicated approval decision command and proper authority."
          },
          {
            action: "mutate_dependency",
            reason: "Dependency write behavior needs its own command contract."
          },
          {
            action: "execute_provider_operation",
            reason: "Provider-side operations must stay behind integration-specific approval-aware commands."
          }
        ]
      }
    }
  });
}));
