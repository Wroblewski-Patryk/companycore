import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { Request } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../db/prisma";
import { encryptSecret, decryptSecret } from "../secrets";
import { IntegrationError } from "../errors";
import { getGoogleDriveSettingsForWorkspace } from "../integration-settings.service";
import { GoogleDriveClient } from "./google-drive.client";
import { syncGoogleDriveNotesForWorkspace } from "./google-drive.sync";

function webhookEndpointUrl(req?: { protocol?: string; get(name: string): string | undefined }) {
  const configuredBase = env.publicApiBaseUrl?.replace(/\/$/, "");
  if (configuredBase) {
    return `${configuredBase}/v1/webhooks/google-drive`;
  }

  const host = req?.get("host");
  const proto = req?.get("x-forwarded-proto") ?? req?.protocol;
  if (!host || !proto) {
    throw new IntegrationError("integration_unavailable", 502, "Cannot resolve public Google Drive webhook endpoint URL.");
  }
  return `${proto}://${host}/v1/webhooks/google-drive`;
}

export async function reconcileGoogleDriveWatchForWorkspace(workspaceId: string, req?: Request) {
  const settings = await getGoogleDriveSettingsForWorkspace(workspaceId);
  if (!settings) {
    throw new IntegrationError("integration_not_configured", 400, "Google Drive integration is not configured for this workspace.");
  }

  const client = new GoogleDriveClient(settings.token);
  const pageToken = await client.getStartPageToken();
  const channelId = `companycore-${workspaceId}-${Date.now()}`;
  const channelToken = settings.config.webhookToken ?? randomBytes(24).toString("base64url");
  const endpointUrl = webhookEndpointUrl(req);
  const channel = await client.watchChanges({
    pageToken,
    address: endpointUrl,
    channelId,
    token: channelToken
  });

  const registration = await prisma.externalWebhookRegistration.upsert({
    where: {
      workspaceId_provider_externalId: {
        workspaceId,
        provider: "google_drive",
        externalId: channel.id!
      }
    },
    update: {
      endpointUrl,
      secretCiphertext: encryptSecret(channelToken),
      scopeType: "changes",
      scopeExternalId: pageToken,
      status: "active",
      lastHealthAt: new Date(),
      lastErrorCode: null,
      events: {
        resourceId: channel.resourceId,
        resourceUri: channel.resourceUri,
        expiration: channel.expiration
      } as Prisma.InputJsonValue
    },
    create: {
      workspaceId,
      provider: "google_drive",
      externalId: channel.id!,
      endpointUrl,
      secretCiphertext: encryptSecret(channelToken),
      scopeType: "changes",
      scopeExternalId: pageToken,
      status: "active",
      lastHealthAt: new Date(),
      events: {
        resourceId: channel.resourceId,
        resourceUri: channel.resourceUri,
        expiration: channel.expiration
      } as Prisma.InputJsonValue
    }
  });

  return {
    id: registration.id,
    provider: registration.provider,
    externalId: registration.externalId,
    scopeType: registration.scopeType,
    scopeExternalId: registration.scopeExternalId,
    endpointUrl: registration.endpointUrl,
    status: registration.status,
    lastHealthAt: registration.lastHealthAt,
    lastErrorCode: registration.lastErrorCode,
    events: registration.events,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt
  };
}

export async function listGoogleDriveWebhookRegistrations(workspaceId: string) {
  return prisma.externalWebhookRegistration.findMany({
    where: { workspaceId, provider: "google_drive" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      provider: true,
      externalId: true,
      scopeType: true,
      scopeExternalId: true,
      endpointUrl: true,
      events: true,
      status: true,
      lastHealthAt: true,
      lastErrorCode: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

function header(req: Request, name: string) {
  const value = req.get(name);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function safeTokenEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function registrationResourceId(registration: { events: Prisma.JsonValue }) {
  const events = registration.events;
  if (!events || typeof events !== "object" || Array.isArray(events)) {
    return null;
  }

  const value = (events as { resourceId?: unknown }).resourceId;
  return typeof value === "string" ? value : null;
}

export async function acceptGoogleDriveNotification(req: Request) {
  const channelId = header(req, "x-goog-channel-id");
  const channelToken = header(req, "x-goog-channel-token");
  const messageNumber = header(req, "x-goog-message-number");
  const resourceState = header(req, "x-goog-resource-state");
  const resourceId = header(req, "x-goog-resource-id");

  if (!channelId || !channelToken || !messageNumber || !resourceState) {
    throw new IntegrationError("invalid_webhook_payload", 400, "Missing Google Drive notification headers.");
  }

  const registration = await prisma.externalWebhookRegistration.findFirst({
    where: {
      provider: "google_drive",
      externalId: channelId,
      status: "active"
    }
  });
  if (!registration) {
    throw new IntegrationError("webhook_not_registered", 404, "Google Drive webhook is not registered.");
  }

  if (!safeTokenEqual(decryptSecret(registration.secretCiphertext), channelToken)) {
    throw new IntegrationError("invalid_webhook_signature", 401, "Google Drive channel token mismatch.");
  }

  const expectedResourceId = registrationResourceId(registration);
  if (expectedResourceId && resourceId && expectedResourceId !== resourceId) {
    throw new IntegrationError("invalid_webhook_signature", 401, "Google Drive resource ID mismatch.");
  }

  const payload = {
    channelId,
    messageNumber,
    resourceState,
    resourceId,
    changed: header(req, "x-goog-changed"),
    resourceUri: header(req, "x-goog-resource-uri")
  };
  const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const idempotencyKey = `${channelId}:${messageNumber}`;

  const inbox = await prisma.providerEventInbox.upsert({
    where: {
      workspaceId_provider_idempotencyKey: {
        workspaceId: registration.workspaceId,
        provider: "google_drive",
        idempotencyKey
      }
    },
    update: {},
    create: {
      workspaceId: registration.workspaceId,
      provider: "google_drive",
      webhookRegistrationId: registration.id,
      externalWebhookId: channelId,
      eventName: resourceState,
      externalTaskId: null,
      idempotencyKey,
      payloadHash,
      payload: payload as Prisma.InputJsonValue,
      signatureVerified: true,
      processingStatus: "pending"
    }
  });

  if (inbox.processingStatus !== "processed" && resourceState === "change") {
    try {
      await syncGoogleDriveNotesForWorkspace(registration.workspaceId);
      const processedInbox = await prisma.providerEventInbox.update({
        where: { id: inbox.id },
        data: {
          processingStatus: "processed",
          processedAt: new Date(),
          lastErrorCode: null
        }
      });

      return {
        id: processedInbox.id,
        status: "accepted",
        provider: processedInbox.provider,
        eventName: processedInbox.eventName,
        processingStatus: processedInbox.processingStatus
      };
    } catch (error) {
      const code = error instanceof IntegrationError ? error.code : "sync_failed";
      const failedInbox = await prisma.providerEventInbox.update({
        where: { id: inbox.id },
        data: {
          processingStatus: "failed",
          retryCount: { increment: 1 },
          lastErrorCode: code
        }
      });

      return {
        id: failedInbox.id,
        status: "accepted",
        provider: failedInbox.provider,
        eventName: failedInbox.eventName,
        processingStatus: failedInbox.processingStatus
      };
    }
  }

  return {
    id: inbox.id,
    status: "accepted",
    provider: inbox.provider,
    eventName: inbox.eventName,
    processingStatus: inbox.processingStatus
  };
}
