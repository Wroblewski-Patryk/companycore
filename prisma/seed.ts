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
      update: { name, position },
      create: {
        id: `00000000-0000-4000-8000-${String(position + 1).padStart(12, "0")}`,
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
