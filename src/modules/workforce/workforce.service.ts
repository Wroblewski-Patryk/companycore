import {
  Prisma,
  WorkforceEntity,
  WorkforceEntityStatus,
  WorkforceEntityType,
  WorkforcePersonalityProfile,
  WorkforceRuntimeMode
} from "@prisma/client";
import { prisma } from "../../db/prisma";
import { toJsonInput } from "../../integrations/integration-settings.service";
import { createEvent } from "../events/event.service";

export const workforceEntityTypes = ["human", "agent"] as const satisfies WorkforceEntityType[];
export const workforceEntityStatuses = ["active", "inactive", "paused", "archived"] as const satisfies WorkforceEntityStatus[];
export const workforceRuntimeModes = ["manual", "semi_autonomous", "autonomous"] as const satisfies WorkforceRuntimeMode[];
export const workforcePersonalityProfiles = ["analytical", "creative", "executive", "supportive", "researcher", "custom"] as const satisfies WorkforcePersonalityProfile[];

export type WorkforceEntityInput = {
  type: WorkforceEntityType;
  status?: WorkforceEntityStatus;
  name: string;
  slug?: string;
  description?: string | null;
  avatar?: string | null;
  department?: string | null;
  role?: string | null;
  managerId?: string | null;
  personalityProfile?: WorkforcePersonalityProfile;
  model?: string | null;
  runtimeMode?: WorkforceRuntimeMode;
  paperclipAgentId?: string | null;
  synchronizationEnabled?: boolean;
};

export type WorkforceEntityUpdate = Partial<Omit<WorkforceEntityInput, "type">> & {
  type?: WorkforceEntityType;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "workforce-entity";
}

async function uniqueSlug(workspaceId: string, name: string, requestedSlug?: string, existingId?: string) {
  const base = slugify(requestedSlug || name);
  let slug = base;
  let suffix = 2;

  while (await prisma.workforceEntity.findFirst({
    where: {
      workspaceId,
      slug,
      ...(existingId ? { id: { not: existingId } } : {})
    },
    select: { id: true }
  })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function asSyncLog(value: unknown) {
  return Array.isArray(value) ? value.slice(-19) : [];
}

export function generateWorkforceMarkdown(entity: Pick<WorkforceEntity,
  "name" | "description" | "department" | "role" | "personalityProfile" | "runtimeMode" | "model" | "paperclipAgentId" | "type"
>) {
  const responsibilities = entity.description?.trim() || "Responsibilities are defined by the role, assigned tasks, and CompanyCore governance.";
  const communicationStyle = {
    analytical: "Precise, evidence-led, and careful about uncertainty.",
    creative: "Exploratory, option-rich, and comfortable with divergent ideas.",
    executive: "Concise, priority-driven, and decision-oriented.",
    supportive: "Calm, helpful, and focused on reducing friction for collaborators.",
    researcher: "Curious, source-aware, and explicit about assumptions.",
    custom: "Custom communication style managed by CompanyCore."
  }[entity.personalityProfile];
  const decisionStyle = {
    analytical: "Compare evidence, risks, and tradeoffs before recommending a path.",
    creative: "Generate options first, then converge on the most useful next step.",
    executive: "Prefer clear ownership, priority, and reversible decisions.",
    supportive: "Prefer consensus, clarity, and low-friction collaboration.",
    researcher: "Validate sources and record uncertainty before acting.",
    custom: "Follow the custom decision policy configured in CompanyCore."
  }[entity.personalityProfile];

  return {
    "agent.md": `# ${entity.name}

## Identity
- Type: ${entity.type}
- Role: ${entity.role || "Unassigned"}
- Department: ${entity.department || "06-kadry"}

## Responsibilities
${responsibilities}

## Runtime
- Runtime mode: ${entity.runtimeMode}
- Model: ${entity.model || "not configured"}
- Paperclip agent ID: ${entity.paperclipAgentId || "not linked"}
`,
    "personality.md": `# ${entity.name} Personality

## Profile
- Personality profile: ${entity.personalityProfile}

## Communication Style
${communicationStyle}

## Decision Style
${decisionStyle}
`,
    "environment.md": `# ${entity.name} Environment

## CompanyCore
CompanyCore, now evolving toward Roost, is the organizational source of truth for people, agents, roles, responsibilities, work, knowledge, permissions, and integration state.

## Organization
The entity belongs to ${entity.department || "06 People / Agents"} and operates through CompanyCore records, tasks, resources, events, and governed API/MCP access.

## Paperclip
Paperclip is the external agent runtime. CompanyCore owns the configuration and synchronization packet; Paperclip executes with the latest synchronized context instead of becoming the source of truth.
`
  };
}

function withGeneratedFiles<T extends WorkforceEntity>(entity: T) {
  return {
    ...entity,
    generatedFiles: generateWorkforceMarkdown(entity)
  };
}

export async function listWorkforceEntities(workspaceId: string, filters: {
  type?: WorkforceEntityType;
  status?: WorkforceEntityStatus;
  q?: string;
}) {
  const where: Prisma.WorkforceEntityWhereInput = {
    workspaceId,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q ? {
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { role: { contains: filters.q, mode: "insensitive" } },
        { department: { contains: filters.q, mode: "insensitive" } },
        { slug: { contains: filters.q, mode: "insensitive" } }
      ]
    } : {})
  };

  const [entities, counts] = await Promise.all([
    prisma.workforceEntity.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: { manager: { select: { id: true, name: true, slug: true } } }
    }),
    Promise.all([
      prisma.workforceEntity.count({ where: { workspaceId } }),
      prisma.workforceEntity.count({ where: { workspaceId, type: "human" } }),
      prisma.workforceEntity.count({ where: { workspaceId, type: "agent" } }),
      prisma.workforceEntity.count({ where: { workspaceId, synchronizationEnabled: true } }),
      prisma.workforceEntity.count({ where: { workspaceId, syncStatus: "queued" } })
    ])
  ]);

  const [total, humans, agents, syncEnabled, syncQueued] = counts;
  return {
    summary: {
      total,
      humans,
      agents,
      syncEnabled,
      syncQueued,
      visible: entities.length
    },
    entities: entities.map(withGeneratedFiles),
    dictionaries: {
      types: workforceEntityTypes,
      statuses: workforceEntityStatuses,
      runtimeModes: workforceRuntimeModes,
      personalityProfiles: workforcePersonalityProfiles
    },
    agentPacket: {
      mode: "source_of_truth",
      allowedActions: [
        "read_workforce_entities",
        "edit_workforce_entity",
        "preview_generated_markdown",
        "request_manual_paperclip_sync"
      ],
      blockedActions: [
        {
          action: "paperclip_config_as_source_of_truth",
          reason: "CompanyCore/Roost owns workforce configuration. Paperclip is runtime only."
        },
        {
          action: "autonomous_hr_decisions",
          reason: "Hiring, firing, pay, access expansion, and authority changes need future RBAC and owner approval contracts."
        }
      ]
    }
  };
}

export async function getWorkforceEntity(workspaceId: string, id: string) {
  const entity = await prisma.workforceEntity.findFirst({
    where: { id, workspaceId },
    include: { manager: { select: { id: true, name: true, slug: true } } }
  });
  return entity ? withGeneratedFiles(entity) : null;
}

export async function createWorkforceEntity(workspaceId: string, input: WorkforceEntityInput) {
  const slug = await uniqueSlug(workspaceId, input.name, input.slug);
  const generatedFiles = generateWorkforceMarkdown({
    name: input.name,
    description: input.description ?? null,
    department: input.department ?? "06-kadry",
    role: input.role ?? null,
    personalityProfile: input.personalityProfile ?? "supportive",
    runtimeMode: input.runtimeMode ?? "manual",
    model: input.model ?? null,
    paperclipAgentId: input.paperclipAgentId ?? null,
    type: input.type
  });

  const entity = await prisma.workforceEntity.create({
    data: {
      workspaceId,
      ...input,
      slug,
      department: input.department ?? "06-kadry",
      generatedFiles: toJsonInput(generatedFiles)
    }
  });

  await createEvent({
    type: "workforce_entity_created",
    workspaceId,
    source: "companycore",
    payload: { workforceEntityId: entity.id, type: entity.type, name: entity.name }
  });

  return withGeneratedFiles(entity);
}

export async function updateWorkforceEntity(workspaceId: string, id: string, input: WorkforceEntityUpdate) {
  const existing = await prisma.workforceEntity.findFirst({ where: { id, workspaceId } });
  if (!existing) return null;

  if (input.managerId) {
    const manager = await prisma.workforceEntity.findFirst({
      where: { id: input.managerId, workspaceId },
      select: { id: true }
    });
    if (!manager || manager.id === existing.id) {
      throw Object.assign(new Error("invalid_manager"), { status: 422 });
    }
  }

  const next = {
    ...existing,
    ...input,
    name: input.name ?? existing.name,
    description: input.description === undefined ? existing.description : input.description,
    department: input.department === undefined ? existing.department : input.department,
    role: input.role === undefined ? existing.role : input.role,
    personalityProfile: input.personalityProfile ?? existing.personalityProfile,
    runtimeMode: input.runtimeMode ?? existing.runtimeMode,
    model: input.model === undefined ? existing.model : input.model,
    paperclipAgentId: input.paperclipAgentId === undefined ? existing.paperclipAgentId : input.paperclipAgentId,
    type: input.type ?? existing.type
  };
  const generatedFiles = generateWorkforceMarkdown(next);

  const entity = await prisma.workforceEntity.update({
    where: { id: existing.id },
    data: {
      ...input,
      ...(input.name || input.slug ? { slug: await uniqueSlug(workspaceId, input.name ?? existing.name, input.slug ?? existing.slug, existing.id) } : {}),
      generatedFiles: toJsonInput(generatedFiles),
      syncStatus: existing.syncStatus === "synced" ? "stale" : existing.syncStatus
    }
  });

  await createEvent({
    type: "workforce_entity_updated",
    workspaceId,
    source: "companycore",
    payload: { workforceEntityId: entity.id, changed: Object.keys(input) }
  });

  return withGeneratedFiles(entity);
}

export async function archiveWorkforceEntity(workspaceId: string, id: string) {
  return updateWorkforceEntity(workspaceId, id, { status: "archived", synchronizationEnabled: false });
}

export async function syncWorkforceEntity(workspaceId: string, id: string, requestedByUserId?: string) {
  const existing = await prisma.workforceEntity.findFirst({ where: { id, workspaceId } });
  if (!existing) return null;
  if (existing.type !== "agent" || !existing.synchronizationEnabled) {
    throw Object.assign(new Error("sync_not_enabled"), { status: 409 });
  }

  const generatedFiles = generateWorkforceMarkdown(existing);
  const logEntry = {
    at: new Date().toISOString(),
    status: "queued",
    actor: requestedByUserId ? "user" : "api_key",
    message: "Paperclip runtime synchronization requested from CompanyCore."
  };

  const outbox = await prisma.agentEventOutbox.create({
    data: {
      workspaceId,
      eventType: "paperclip_agent_config_sync_requested",
      targetAgent: existing.paperclipAgentId || existing.slug,
      scope: {
        workforceEntityId: existing.id,
        department: existing.department,
        sourceOfTruth: "companycore"
      },
      payload: {
        workforceEntity: {
          id: existing.id,
          type: existing.type,
          status: existing.status,
          name: existing.name,
          slug: existing.slug,
          department: existing.department,
          role: existing.role,
          runtimeMode: existing.runtimeMode,
          model: existing.model,
          paperclipAgentId: existing.paperclipAgentId
        },
        generatedFiles
      }
    }
  });

  const entity = await prisma.workforceEntity.update({
    where: { id: existing.id },
    data: {
      generatedFiles: toJsonInput(generatedFiles),
      syncStatus: "queued",
      syncLog: toJsonInput([...asSyncLog(existing.syncLog), { ...logEntry, outboxId: outbox.id }])
    }
  });

  await createEvent({
    type: "workforce_entity_sync_requested",
    workspaceId,
    source: "companycore",
    payload: {
      workforceEntityId: entity.id,
      outboxId: outbox.id,
      targetAgent: outbox.targetAgent
    }
  });

  return {
    entity: withGeneratedFiles(entity),
    outboxId: outbox.id
  };
}
