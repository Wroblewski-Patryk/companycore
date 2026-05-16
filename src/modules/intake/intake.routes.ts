import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";

const intakeQuerySchema = z.object({
  family: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  sourceAgent: z.string().min(1).optional(),
  risk: z.string().min(1).optional(),
  suggestedDepartment: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100)
}).strict();

type IntakeItem = {
  id: string;
  family: string;
  status: string;
  title: string;
  source: string;
  sourceAgent?: string | null;
  sourceModel: string;
  sourceId: string;
  risk: "low" | "medium" | "high" | "critical";
  suggestedDepartment: string;
  confidence: "direct" | "inferred" | "needs_review";
  createdAt: string;
  updatedAt: string;
  summary?: string | null;
  evidence: Array<{ label: string; href: string }>;
  allowedActions: string[];
  blockedActions: Array<{ action: string; reason: string }>;
  metadata: Record<string, unknown>;
};

const departmentHints = [
  { key: "07-finance", terms: ["price", "pricing", "discount", "invoice", "payment", "cost", "margin", "finance"] },
  { key: "03-sales", terms: ["lead", "deal", "offer", "proposal", "sales", "client prospect", "promotion", "ad"] },
  { key: "05-client-relations", terms: ["client", "support", "feedback", "follow-up", "relationship", "customer"] },
  { key: "04-operations", terms: ["operation", "workflow", "sop", "dependency", "routine", "approval", "blocker"] },
  { key: "01-strategy", terms: ["strategy", "goal", "target", "kpi", "vision", "positioning"] },
  { key: "02-product-delivery", terms: ["product", "delivery", "acceptance", "test", "scope", "service"] },
  { key: "08-assets-knowledge", terms: ["drive", "file", "folder", "resource", "asset", "knowledge", "document"] },
  { key: "09-technology-automation", terms: ["agent", "mcp", "api", "integration", "runtime", "webhook", "automation"] },
  { key: "10-governance-risk-legal", terms: ["policy", "legal", "risk", "control", "security", "permission"] },
  { key: "11-innovation-improvement", terms: ["experiment", "improvement", "lesson", "retrospective", "idea"] },
  { key: "06-people-agents-roles", terms: ["role", "people", "agent capacity", "capacity", "escalation", "owner"] }
] as const;

export const intakeRouter = Router();

intakeRouter.get("/", asyncHandler(async (req, res) => {
  const query = intakeQuerySchema.parse(req.query);
  const workspaceId = req.auth!.workspaceId;
  const now = new Date();
  const perSourceLimit = Math.max(20, Math.min(query.limit, 75));

  const [
    agentEvents,
    providerEvents,
    driveFiles,
    containerMappings,
    fieldMappings,
    approvals,
    risks,
    tasks,
    events
  ] = await Promise.all([
    prisma.agentEventOutbox.findMany({
      where: {
        workspaceId,
        deliveryStatus: "pending",
        availableAt: { lte: now },
        OR: query.sourceAgent ? [{ targetAgent: query.sourceAgent }, { targetAgent: null }] : undefined
      },
      orderBy: { availableAt: "asc" },
      take: perSourceLimit
    }),
    prisma.providerEventInbox.findMany({
      where: {
        workspaceId,
        processingStatus: { in: ["pending", "failed"] }
      },
      orderBy: { receivedAt: "desc" },
      take: perSourceLimit
    }),
    prisma.googleDriveFile.findMany({
      where: {
        workspaceId,
        trashed: false,
        operatingAreaId: null,
        operatingFolderId: null,
        operatingTableId: null
      },
      orderBy: { updatedAt: "desc" },
      take: perSourceLimit
    }),
    prisma.externalContainerMapping.findMany({
      where: {
        workspaceId,
        areaId: null,
        folderId: null,
        tableId: null
      },
      orderBy: { updatedAt: "desc" },
      take: perSourceLimit
    }),
    prisma.externalFieldMapping.findMany({
      where: {
        workspaceId,
        tableId: null
      },
      orderBy: { updatedAt: "desc" },
      take: perSourceLimit
    }),
    prisma.approval.findMany({
      where: {
        workspaceId,
        status: "pending"
      },
      orderBy: { createdAt: "desc" },
      take: perSourceLimit
    }),
    prisma.risk.findMany({
      where: {
        workspaceId,
        status: "active",
        riskLevel: { in: ["high", "critical"] }
      },
      orderBy: { updatedAt: "desc" },
      take: perSourceLimit
    }),
    prisma.task.findMany({
      where: {
        workspaceId,
        OR: [
          { projectId: null, goalId: null, targetId: null, taskListId: null },
          { source: { in: ["paperclip", "jarvis", "clickup", "google_drive"] } }
        ]
      },
      orderBy: { updatedAt: "desc" },
      take: perSourceLimit
    }),
    prisma.event.findMany({
      where: {
        workspaceId,
        source: { in: ["paperclip", "jarvis", "clickup", "google_drive", "agent", "automation"] }
      },
      orderBy: { createdAt: "desc" },
      take: perSourceLimit
    })
  ]);

  const items: IntakeItem[] = [
    ...agentEvents.map((event) => item({
      family: "agent_output",
      status: "needs_owner_decision",
      title: readableTitle(event.eventType),
      source: "agent_event_outbox",
      sourceAgent: event.targetAgent,
      sourceModel: "AgentEventOutbox",
      sourceId: event.id,
      risk: inferRisk(event.eventType, event.payload),
      suggestedDepartment: inferDepartment(event.eventType, event.payload),
      confidence: event.targetAgent ? "direct" : "needs_review",
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      summary: stringifySummary(event.payload),
      evidence: [{ label: "Agent event", href: `/v1/agent-events?targetAgent=${event.targetAgent ?? ""}` }],
      allowedActions: ["review", "route_to_department", "create_task", "ack_after_handled"],
      blockedActions: [{ action: "ack", reason: "Intake is read-only; use POST /v1/agent-events/:id/ack after handling." }],
      metadata: {
        eventType: event.eventType,
        deliveryStatus: event.deliveryStatus,
        availableAt: event.availableAt.toISOString(),
        scope: event.scope
      }
    })),
    ...providerEvents.map((event) => item({
      family: "provider_signal",
      status: event.processingStatus === "failed" ? "blocked" : "needs_classification",
      title: `${event.provider} ${readableTitle(event.eventName)}`,
      source: event.provider,
      sourceModel: "ProviderEventInbox",
      sourceId: event.id,
      risk: event.processingStatus === "failed" ? "high" : "medium",
      suggestedDepartment: inferDepartment(`${event.provider} ${event.eventName}`, event.payload),
      confidence: "inferred",
      createdAt: event.receivedAt,
      updatedAt: event.updatedAt,
      summary: event.lastErrorCode ?? stringifySummary(event.payload),
      evidence: [{ label: "Provider inbox", href: `/v1/integration-settings/${event.provider}/events?status=${event.processingStatus}` }],
      allowedActions: ["review", "route_to_department", "retry_provider_event"],
      blockedActions: event.processingStatus === "failed"
        ? [{ action: "auto_retry_all", reason: "Failed provider events require bounded replay through provider retry route." }]
        : [],
      metadata: {
        eventName: event.eventName,
        externalTaskId: event.externalTaskId,
        processingStatus: event.processingStatus,
        retryCount: event.retryCount,
        lastErrorCode: event.lastErrorCode
      }
    })),
    ...driveFiles.map((file) => item({
      family: "unassigned_resource",
      status: "needs_classification",
      title: file.name,
      source: "google_drive",
      sourceModel: "GoogleDriveFile",
      sourceId: file.id,
      risk: "low",
      suggestedDepartment: inferDepartment(`${file.name} ${file.description ?? ""} drive file`, file.rawMetadata),
      confidence: "inferred",
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      summary: file.description,
      evidence: [{ label: "Drive file", href: file.webViewLink ?? `/v1/google-drive/files/${file.id}` }],
      allowedActions: ["review", "assign_scope", "route_to_department"],
      blockedActions: [{ action: "delete_file", reason: "Provider deletion is outside the global intake read contract." }],
      metadata: {
        mimeType: file.mimeType,
        isFolder: file.isFolder,
        scanStatus: file.scanStatus,
        syncStatus: file.syncStatus
      }
    })),
    ...containerMappings.map((mapping) => item({
      family: "unassigned_resource",
      status: "needs_classification",
      title: mapping.name ?? `${mapping.provider} ${mapping.entityType} ${mapping.externalId}`,
      source: mapping.provider,
      sourceModel: "ExternalContainerMapping",
      sourceId: mapping.id,
      risk: "low",
      suggestedDepartment: inferDepartment(`${mapping.name ?? ""} ${mapping.entityType}`, mapping.raw),
      confidence: "inferred",
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
      summary: `${mapping.provider} ${mapping.entityType} is not assigned to an operating area, folder, or table.`,
      evidence: [{ label: "Relationship graph", href: "/v1/relationships/graph?includeReview=true" }],
      allowedActions: ["review", "assign_scope", "route_to_department"],
      blockedActions: [],
      metadata: {
        provider: mapping.provider,
        entityType: mapping.entityType,
        externalId: mapping.externalId
      }
    })),
    ...fieldMappings.map((mapping) => item({
      family: "unassigned_resource",
      status: "needs_classification",
      title: mapping.name ?? `${mapping.provider} field ${mapping.externalId}`,
      source: mapping.provider,
      sourceModel: "ExternalFieldMapping",
      sourceId: mapping.id,
      risk: "low",
      suggestedDepartment: inferDepartment(`${mapping.name ?? ""} ${mapping.fieldType ?? ""}`, mapping.typeConfig),
      confidence: "inferred",
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
      summary: `${mapping.provider} field is not mapped to an operating table.`,
      evidence: [{ label: "Relationship graph", href: "/v1/relationships/graph?includeReview=true" }],
      allowedActions: ["review", "map_field", "route_to_department"],
      blockedActions: [],
      metadata: {
        provider: mapping.provider,
        externalId: mapping.externalId,
        fieldType: mapping.fieldType,
        nativeField: mapping.nativeField
      }
    })),
    ...approvals.map((approval) => item({
      family: "risk_or_approval",
      status: "needs_owner_decision",
      title: `Approval required: ${readableTitle(approval.requestedForAction)}`,
      source: "company_os",
      sourceAgent: approval.requestedByType === "agent" ? approval.requestedById : null,
      sourceModel: "Approval",
      sourceId: approval.id,
      risk: approval.riskLevel,
      suggestedDepartment: inferDepartment(`${approval.requestedForAction} ${approval.resourceType}`),
      confidence: "direct",
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      summary: approval.decisionReason,
      evidence: [{ label: "Approval", href: `/v1/company-os/approvals/${approval.id}` }],
      allowedActions: ["review", "approve_or_reject", "route_to_department"],
      blockedActions: [{ action: "execute_requested_action", reason: "Pending approval must be decided before risky work can continue." }],
      metadata: {
        requestedByType: approval.requestedByType,
        requestedById: approval.requestedById,
        requestedForAction: approval.requestedForAction,
        resourceType: approval.resourceType,
        resourceId: approval.resourceId,
        expiresAt: approval.expiresAt?.toISOString() ?? null
      }
    })),
    ...risks.map((risk) => item({
      family: "risk_or_approval",
      status: "blocked",
      title: `High risk: ${risk.name}`,
      source: "company_os",
      sourceModel: "Risk",
      sourceId: risk.id,
      risk: risk.riskLevel,
      suggestedDepartment: inferDepartment(`${risk.name} ${risk.category ?? ""} risk ${risk.description ?? ""}`),
      confidence: "direct",
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt,
      summary: risk.description,
      evidence: [{ label: "Company OS risks", href: `/v1/company-os/risks/${risk.id}` }],
      allowedActions: ["review", "create_control", "route_to_department"],
      blockedActions: [{ action: "ignore_risk", reason: "High and critical active risks must have an owner response." }],
      metadata: {
        category: risk.category,
        likelihood: risk.likelihood,
        impact: risk.impact,
        processId: risk.processId,
        pipelineId: risk.pipelineId
      }
    })),
    ...tasks.map((task) => item({
      family: task.source === "paperclip" ? "agent_output" : "owner_idea",
      status: "ready_to_route",
      title: task.title,
      source: task.source ?? "companycore",
      sourceAgent: task.source === "paperclip" || task.source === "jarvis" ? task.source : null,
      sourceModel: "Task",
      sourceId: task.id,
      risk: inferRisk(task.title, task.description),
      suggestedDepartment: inferDepartment(`${task.title} ${task.description ?? ""}`),
      confidence: task.taskListId || task.projectId || task.goalId || task.targetId ? "inferred" : "needs_review",
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      summary: task.description,
      evidence: [{ label: "Task", href: `/v1/tasks/${task.id}` }],
      allowedActions: ["review", "route_to_department", "assign_project_or_list"],
      blockedActions: [],
      metadata: {
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        goalId: task.goalId,
        targetId: task.targetId,
        taskListId: task.taskListId,
        externalId: task.externalId
      }
    })),
    ...events.map((event) => item({
      family: event.type.includes("feedback") ? "feedback_signal" : "provider_signal",
      status: "needs_classification",
      title: readableTitle(event.type),
      source: event.source ?? "companycore",
      sourceAgent: event.actorType === "agent" ? event.actorId : null,
      sourceModel: "Event",
      sourceId: event.id,
      risk: inferRisk(event.type, event.payload),
      suggestedDepartment: inferDepartment(`${event.type} ${event.resourceType ?? ""}`, event.payload),
      confidence: "inferred",
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      summary: stringifySummary(event.payload),
      evidence: [{ label: "Event", href: `/v1/events?type=${event.type}` }],
      allowedActions: ["review", "route_to_department", "create_task"],
      blockedActions: [],
      metadata: {
        type: event.type,
        actorType: event.actorType,
        actorId: event.actorId,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        correlationId: event.correlationId
      }
    }))
  ];

  const filtered = items
    .filter((intakeItem) => !query.family || intakeItem.family === query.family)
    .filter((intakeItem) => !query.status || intakeItem.status === query.status)
    .filter((intakeItem) => !query.risk || intakeItem.risk === query.risk)
    .filter((intakeItem) => !query.suggestedDepartment || intakeItem.suggestedDepartment === query.suggestedDepartment)
    .filter((intakeItem) => !query.sourceAgent || intakeItem.sourceAgent === query.sourceAgent || intakeItem.sourceAgent == null)
    .sort(compareIntakeItems)
    .slice(0, query.limit);

  res.json({
    data: {
      workspaceId,
      query,
      summary: summarize(filtered),
      items: filtered
    }
  });
}));

function item(input: Omit<IntakeItem, "id" | "createdAt" | "updatedAt"> & { createdAt: Date; updatedAt: Date }): IntakeItem {
  return {
    ...input,
    id: `${input.sourceModel}:${input.sourceId}`,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString()
  };
}

function readableTitle(value: string) {
  return value
    .replace(/[_:.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function stringifySummary(value: unknown) {
  if (value == null) {
    return null;
  }

  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 240 ? `${text.slice(0, 237)}...` : text;
}

function searchable(value: unknown) {
  if (value == null) {
    return "";
  }
  return typeof value === "string" ? value.toLowerCase() : JSON.stringify(value).toLowerCase();
}

function inferRisk(...values: unknown[]): IntakeItem["risk"] {
  const text = values.map(searchable).join(" ");
  if (["critical", "credential", "secret", "payment", "invoice", "legal", "security"].some((term) => text.includes(term))) {
    return "critical";
  }
  if (["failed", "blocked", "approval", "risk", "delete", "archive", "permission"].some((term) => text.includes(term))) {
    return "high";
  }
  if (["client", "offer", "deadline", "pricing", "discount"].some((term) => text.includes(term))) {
    return "medium";
  }
  return "low";
}

function inferDepartment(...values: unknown[]) {
  const text = values.map(searchable).join(" ");
  const match = departmentHints.find((department) => department.terms.some((term) => text.includes(term)));
  return match?.key ?? "00-main";
}

function riskRank(risk: IntakeItem["risk"]) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[risk];
}

function statusRank(status: string) {
  return {
    blocked: 0,
    needs_owner_decision: 1,
    needs_classification: 2,
    ready_to_route: 3
  }[status] ?? 4;
}

function compareIntakeItems(left: IntakeItem, right: IntakeItem) {
  return riskRank(left.risk) - riskRank(right.risk)
    || statusRank(left.status) - statusRank(right.status)
    || right.updatedAt.localeCompare(left.updatedAt);
}

function summarize(items: IntakeItem[]) {
  const byFamily: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byRisk: Record<string, number> = {};
  const byDepartment: Record<string, number> = {};

  for (const intakeItem of items) {
    byFamily[intakeItem.family] = (byFamily[intakeItem.family] ?? 0) + 1;
    byStatus[intakeItem.status] = (byStatus[intakeItem.status] ?? 0) + 1;
    byRisk[intakeItem.risk] = (byRisk[intakeItem.risk] ?? 0) + 1;
    byDepartment[intakeItem.suggestedDepartment] = (byDepartment[intakeItem.suggestedDepartment] ?? 0) + 1;
  }

  return {
    total: items.length,
    byFamily,
    byStatus,
    byRisk,
    byDepartment
  };
}
