import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { ClickUpClient } from "../../integrations/clickup/clickup.client";
import {
  deleteClickUpWebhookRegistration,
  listClickUpProviderEvents,
  listClickUpWebhookRegistrations,
  reconcileClickUpWebhooksForWorkspace,
  retryFailedClickUpProviderEvents
} from "../../integrations/clickup/clickup.webhooks";
import { IntegrationError } from "../../integrations/errors";
import { syncGoogleDriveNotesForWorkspace } from "../../integrations/google-drive/google-drive.sync";
import {
  listGoogleDriveWebhookRegistrations,
  reconcileGoogleDriveWatchForWorkspace
} from "../../integrations/google-drive/google-drive.webhooks";
import { getClickUpSettingsForWorkspace, toJsonInput } from "../../integrations/integration-settings.service";
import { encryptSecret } from "../../integrations/secrets";
import { asyncHandler } from "../../middleware/async-handler";
import { persistClickUpStructure } from "../../operating-model/clickup-structure";

const providerSchema = z.object({
  provider: z.enum(["clickup", "google_drive", "google-drive"])
});

const clickUpConfigSchema = z.object({
  teamId: z.string().min(1).optional(),
  spaceIds: z.array(z.string().min(1)).optional(),
  folderIds: z.array(z.string().min(1)).optional(),
  listIds: z.array(z.string().min(1)).optional(),
  syncMode: z.enum(["pull", "two_way"]).optional(),
  importMode: z.enum(["merge", "skip_existing", "replace_selected_lists", "inspect_only"]).optional()
}).strict();

const googleDriveConfigSchema = z.object({
  rootFolderId: z.string().min(1).optional(),
  syncMode: z.enum(["pull", "two_way"]).optional(),
  includeGoogleDocs: z.boolean().optional(),
  pushNotesToDrive: z.boolean().optional(),
  webhookToken: z.string().min(12).optional()
}).strict();

const upsertIntegrationSettingSchema = z.object({
  token: z.string().min(1).optional(),
  config: z.unknown().optional(),
  active: z.boolean().optional()
}).strict();

const discoverClickUpSchema = z.object({
  token: z.string().min(1).optional(),
  teamId: z.string().min(1).optional(),
  useStoredToken: z.boolean().optional()
}).strict();

const providerEventStatusSchema = z.enum(["pending", "processed", "failed"]);

const retryProviderEventsSchema = z.object({
  eventIds: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(100).optional()
}).strict();

const googleDriveNoteSyncSchema = z.object({
  push: z.boolean().optional()
}).strict();

export const integrationSettingsRouter = Router();

function safeIntegrationSetting(setting: {
  id: string;
  workspaceId: string;
  provider: string;
  secretCiphertext: string | null;
  config: unknown;
  active: boolean;
  lastValidatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: setting.id,
    workspaceId: setting.workspaceId,
    provider: setting.provider,
    config: setting.config,
    active: setting.active,
    secretConfigured: Boolean(setting.secretCiphertext),
    lastValidatedAt: setting.lastValidatedAt,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt
  };
}

async function getIntegrationSetting(req: Parameters<Parameters<typeof integrationSettingsRouter.get>[1]>[0], res: Parameters<Parameters<typeof integrationSettingsRouter.get>[1]>[1], provider: "clickup" | "google_drive") {
  const setting = await prisma.integrationSetting.findUnique({
    where: {
      workspaceId_provider: {
        workspaceId: req.auth!.workspaceId,
        provider
      }
    }
  });

  if (!setting) {
    return res.status(404).json({ error: "integration_not_configured" });
  }

  return res.json({ data: safeIntegrationSetting(setting) });
}

async function putIntegrationSetting(req: Parameters<Parameters<typeof integrationSettingsRouter.put>[1]>[0], res: Parameters<Parameters<typeof integrationSettingsRouter.put>[1]>[1], provider: "clickup" | "google_drive") {
  const input = upsertIntegrationSettingSchema.parse(req.body);
  const config = input.config === undefined
    ? undefined
    : provider === "clickup"
      ? clickUpConfigSchema.parse(input.config)
      : googleDriveConfigSchema.parse(input.config);
  const existing = await prisma.integrationSetting.findUnique({
    where: {
      workspaceId_provider: {
        workspaceId: req.auth!.workspaceId,
        provider
      }
    }
  });

  if (!existing && !input.token) {
    return res.status(400).json({ error: "integration_secret_required" });
  }

  const setting = existing
    ? await prisma.integrationSetting.update({
      where: {
        workspaceId_provider: {
          workspaceId: req.auth!.workspaceId,
          provider
        }
      },
      data: {
        secretCiphertext: input.token ? encryptSecret(input.token) : existing.secretCiphertext,
        config: config ? toJsonInput(config) : existing.config ?? {},
        active: input.active ?? existing.active
      }
    })
    : await prisma.integrationSetting.create({
      data: {
        workspaceId: req.auth!.workspaceId,
        provider,
        secretCiphertext: encryptSecret(input.token!),
        config: toJsonInput(config ?? {}),
        active: input.active ?? true
      }
    });

  return res.json({ data: safeIntegrationSetting(setting) });
}

integrationSettingsRouter.post("/clickup/discover", asyncHandler(async (req, res) => {
  if (req.auth!.authType !== "user") {
    return res.status(403).json({ error: "forbidden" });
  }

  const input = discoverClickUpSchema.parse(req.body);
  const settings = input.useStoredToken
    ? await getClickUpSettingsForWorkspace(req.auth!.workspaceId)
    : null;
  const token = input.token ?? settings?.token;

  if (!token) {
    return res.status(400).json({ error: "integration_secret_required" });
  }

  try {
    const client = new ClickUpClient(token);
    const workspaces = await client.getAuthorizedWorkspaces();
    const selectedWorkspace = input.teamId
      ? workspaces.find((workspace) => workspace.id === input.teamId) ?? null
      : null;
    const spaces = input.teamId
      ? await client.getWorkspaceStructure(input.teamId)
      : [];

    if (input.teamId) {
      await persistClickUpStructure({
        workspaceId: req.auth!.workspaceId,
        selectedWorkspace,
        spaces,
        client
      });
    }

    res.json({
      data: {
        workspaces,
        selectedWorkspace,
        spaces
      }
    });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

integrationSettingsRouter.get("/clickup/webhooks", asyncHandler(async (req, res) => {
  const registrations = await listClickUpWebhookRegistrations(req.auth!.workspaceId);
  res.json({ data: registrations });
}));

integrationSettingsRouter.post("/clickup/webhooks/reconcile", asyncHandler(async (req, res) => {
  if (req.auth!.authType !== "user") {
    return res.status(403).json({ error: "forbidden" });
  }

  try {
    const result = await reconcileClickUpWebhooksForWorkspace(req.auth!.workspaceId, req);
    return res.json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

integrationSettingsRouter.delete("/clickup/webhooks/:id", asyncHandler(async (req, res) => {
  if (req.auth!.authType !== "user") {
    return res.status(403).json({ error: "forbidden" });
  }

  try {
    const result = await deleteClickUpWebhookRegistration({
      workspaceId: req.auth!.workspaceId,
      registrationId: String(req.params.id)
    });
    return res.json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

integrationSettingsRouter.get("/clickup/events", asyncHandler(async (req, res) => {
  const status = typeof req.query.status === "string"
    ? providerEventStatusSchema.parse(req.query.status)
    : undefined;
  const events = await listClickUpProviderEvents({
    workspaceId: req.auth!.workspaceId,
    status
  });
  res.json({ data: events });
}));

integrationSettingsRouter.post("/clickup/events/retry-failed", asyncHandler(async (req, res) => {
  if (req.auth!.authType !== "user") {
    return res.status(403).json({ error: "forbidden" });
  }

  const input = retryProviderEventsSchema.parse(req.body ?? {});
  const result = await retryFailedClickUpProviderEvents({
    workspaceId: req.auth!.workspaceId,
    eventIds: input.eventIds,
    limit: input.limit
  });
  res.json({ data: result });
}));

integrationSettingsRouter.post("/google-drive/sync/notes", asyncHandler(async (req, res) => {
  const input = googleDriveNoteSyncSchema.parse(req.body ?? {});
  try {
    const result = await syncGoogleDriveNotesForWorkspace(req.auth!.workspaceId, input);
    return res.json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

integrationSettingsRouter.get("/google-drive/webhooks", asyncHandler(async (req, res) => {
  const registrations = await listGoogleDriveWebhookRegistrations(req.auth!.workspaceId);
  res.json({ data: registrations });
}));

integrationSettingsRouter.post("/google-drive/webhooks/reconcile", asyncHandler(async (req, res) => {
  if (req.auth!.authType !== "user") {
    return res.status(403).json({ error: "forbidden" });
  }

  try {
    const result = await reconcileGoogleDriveWatchForWorkspace(req.auth!.workspaceId, req);
    return res.json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

integrationSettingsRouter.get("/google-drive", asyncHandler(async (req, res) => {
  return getIntegrationSetting(req, res, "google_drive");
}));

integrationSettingsRouter.put("/google-drive", asyncHandler(async (req, res) => {
  return putIntegrationSetting(req, res, "google_drive");
}));

integrationSettingsRouter.get("/:provider", asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params).provider;
  return getIntegrationSetting(req, res, provider === "google-drive" ? "google_drive" : provider);
}));

integrationSettingsRouter.put("/:provider", asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params).provider;
  return putIntegrationSetting(req, res, provider === "google-drive" ? "google_drive" : provider);
}));
