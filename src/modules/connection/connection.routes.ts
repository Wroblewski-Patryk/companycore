import { Router } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";

const capabilities = [
  "projects:read",
  "projects:write",
  "goals:read",
  "goals:write",
  "targets:read",
  "targets:write",
  "tasks:read",
  "tasks:write",
  "tasks:sync:clickup",
  "clients:read",
  "clients:write",
  "deals:read",
  "deals:write",
  "notes:read",
  "notes:write",
  "decisions:read",
  "decisions:write",
  "agent-logs:read",
  "agent-logs:write",
  "events:read",
  "integration-settings:clickup:read"
] as const;

export const connectionRouter = Router();

connectionRouter.get("/", asyncHandler(async (req, res) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: req.auth!.workspaceId },
    select: {
      id: true,
      name: true,
      ownerUserId: true
    }
  });

  if (!workspace) {
    return res.status(422).json({ error: "workspace_required" });
  }

  const clickUp = await prisma.integrationSetting.findUnique({
    where: {
      workspaceId_provider: {
        workspaceId: workspace.id,
        provider: "clickup"
      }
    },
    select: {
      active: true,
      secretCiphertext: true,
      config: true,
      updatedAt: true
    }
  });

  res.json({
    data: {
      service: "companycore",
      apiVersion: "v1",
      status: "ok",
      auth: {
        type: req.auth!.authType,
        userId: req.auth!.userId,
        apiKeyId: req.auth!.apiKeyId,
        workspaceId: workspace.id
      },
      workspace: {
        id: workspace.id,
        name: workspace.name
      },
      capabilities,
      integrations: {
        clickup: {
          configured: Boolean(clickUp?.secretCiphertext),
          active: Boolean(clickUp?.active),
          config: clickUp?.config ?? {},
          updatedAt: clickUp?.updatedAt ?? null
        }
      }
    }
  });
}));
