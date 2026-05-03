import { PrismaClient } from "@prisma/client";
import { createHmac, randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);
const keyLength = 64;

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

function hashApiKey(apiKey: string) {
  const secret =
    process.env.API_KEY_HASH_SECRET ??
    process.env.AUTH_TOKEN_SECRET ??
    "companycore-api-key-hash-secret";

  return createHmac("sha256", secret).update(apiKey).digest("hex");
}

function apiKeyPrefix(apiKey: string) {
  return apiKey.slice(0, 10);
}

const operatingAreas = [
  { key: "strategy-governance", name: "Strategy and governance", position: 1 },
  { key: "projects-delivery", name: "Projects and delivery", position: 2 },
  { key: "tasks-workflow", name: "Tasks and workflow", position: 3 },
  { key: "sales-crm", name: "Sales and CRM", position: 4 },
  { key: "marketing-growth", name: "Marketing and growth", position: 5 },
  { key: "finance-billing", name: "Finance and billing", position: 6 },
  { key: "people-roles", name: "People and roles", position: 7 },
  { key: "operations-administration", name: "Operations and administration", position: 8 },
  { key: "knowledge-decisions", name: "Knowledge and decisions", position: 9 },
  { key: "assets-storage", name: "Assets and storage", position: 10 },
  { key: "automations-integrations", name: "Automations and integrations", position: 11 },
  { key: "ai-agents-observability", name: "AI agents and observability", position: 12 }
] as const;

const operatingTables = [
  ["projects-delivery", "projects", "projects", "Projects"],
  ["strategy-governance", "goals", "goals", "Goals"],
  ["strategy-governance", "targets", "targets", "Targets"],
  ["tasks-workflow", "task_lists", "task-lists", "Task lists"],
  ["tasks-workflow", "tasks", "tasks", "Tasks"],
  ["sales-crm", "clients", "clients", "Clients"],
  ["sales-crm", "pipeline_stages", "pipeline-stages", "Pipeline stages"],
  ["sales-crm", "deals", "deals", "Deals"],
  ["sales-crm", "interactions", "interactions", "Interactions"],
  ["knowledge-decisions", "notes", "notes", "Notes"],
  ["knowledge-decisions", "decisions", "decisions", "Decisions"],
  ["ai-agents-observability", "agents", "agents", "Agents"],
  ["ai-agents-observability", "agent_logs", "agent-logs", "Agent logs"],
  ["ai-agents-observability", "events", "events", "Events"]
] as const;

async function ensureSeedOperatingModel(workspaceId: string) {
  const areaByKey = new Map<string, { id: string }>();

  for (const area of operatingAreas) {
    const record = await prisma.operatingArea.upsert({
      where: {
        workspaceId_key: {
          workspaceId,
          key: area.key
        }
      },
      update: {
        name: area.name,
        position: area.position
      },
      create: {
        workspaceId,
        key: area.key,
        name: area.name,
        position: area.position
      },
      select: { id: true }
    });
    areaByKey.set(area.key, record);
  }

  for (const [areaKey, tableName, apiSlug, name] of operatingTables) {
    const area = areaByKey.get(areaKey)!;
    await prisma.operatingTable.upsert({
      where: {
        workspaceId_apiSlug: {
          workspaceId,
          apiSlug
        }
      },
      update: {
        areaId: area.id,
        tableName,
        name,
        source: "companycore"
      },
      create: {
        workspaceId,
        areaId: area.id,
        tableName,
        apiSlug,
        name,
        source: "companycore"
      }
    });
  }
}

async function main() {
  const key = process.env.SEED_API_KEY ?? "dev-companycore-key";
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "change-me-local-password";
  const workspaceName = process.env.SEED_WORKSPACE_NAME ?? "LuckySparrow";

  const passwordHash = await hashPassword(ownerPassword);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: "Local owner",
      passwordHash
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: "00000000-0000-4000-8000-000000000100" },
    update: {
      name: workspaceName,
      ownerUserId: owner.id
    },
    create: {
      id: "00000000-0000-4000-8000-000000000100",
      name: workspaceName,
      ownerUserId: owner.id
    }
  });

  await prisma.workspaceMembership.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: owner.id
      }
    },
    update: { role: "owner" },
    create: {
      workspaceId: workspace.id,
      userId: owner.id,
      role: "owner"
    }
  });

  await ensureSeedOperatingModel(workspace.id);

  const keyHash = hashApiKey(key);
  const existingApiKey = await prisma.apiKey.findFirst({
    where: {
      OR: [
        { keyHash },
        { key }
      ]
    }
  });

  if (existingApiKey) {
    await prisma.apiKey.update({
      where: { id: existingApiKey.id },
      data: {
        active: true,
        workspaceId: workspace.id,
        keyHash,
        keyPrefix: apiKeyPrefix(key),
        scopes: []
      }
    });
  } else {
    await prisma.apiKey.create({
      data: {
        name: "Local development key",
        key,
        keyHash,
        keyPrefix: apiKeyPrefix(key),
        scopes: [],
        workspaceId: workspace.id,
        active: true
      }
    });
  }

  const stages = ["Lead", "Qualified", "Proposal", "Won"];
  for (const [position, name] of stages.entries()) {
    await prisma.pipelineStage.upsert({
      where: { id: `00000000-0000-4000-8000-${String(position + 1).padStart(12, "0")}` },
      update: { name, position, workspaceId: workspace.id },
      create: {
        id: `00000000-0000-4000-8000-${String(position + 1).padStart(12, "0")}`,
        workspaceId: workspace.id,
        name,
        position
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
