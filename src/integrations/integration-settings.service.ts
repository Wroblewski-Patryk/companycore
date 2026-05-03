import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { decryptSecret } from "./secrets";

export const supportedIntegrationProviders = ["clickup", "google_drive"] as const;
export type IntegrationProvider = typeof supportedIntegrationProviders[number];

export type ClickUpIntegrationConfig = {
  teamId?: string;
  spaceIds?: string[];
  folderIds?: string[];
  listIds?: string[];
  syncMode?: "pull" | "two_way";
  importMode?: "merge" | "skip_existing" | "replace_selected_lists" | "inspect_only";
};

export type GoogleDriveIntegrationConfig = {
  rootFolderId?: string;
  syncMode?: "pull" | "two_way";
  includeGoogleDocs?: boolean;
  pushNotesToDrive?: boolean;
  webhookToken?: string;
};

export async function getIntegrationSettingForWorkspace(
  workspaceId: string,
  provider: IntegrationProvider
) {
  return prisma.integrationSetting.findUnique({
    where: {
      workspaceId_provider: {
        workspaceId,
        provider
      }
    }
  });
}

export async function getClickUpSettingsForWorkspace(workspaceId: string) {
  const setting = await getIntegrationSettingForWorkspace(workspaceId, "clickup");

  if (!setting?.active || !setting.secretCiphertext) {
    return null;
  }

  return {
    token: decryptSecret(setting.secretCiphertext),
    config: setting.config as ClickUpIntegrationConfig,
    rawSetting: setting
  };
}

export async function getGoogleDriveSettingsForWorkspace(workspaceId: string) {
  const setting = await getIntegrationSettingForWorkspace(workspaceId, "google_drive");

  if (!setting?.active || !setting.secretCiphertext) {
    return null;
  }

  return {
    token: decryptSecret(setting.secretCiphertext),
    config: setting.config as GoogleDriveIntegrationConfig,
    rawSetting: setting
  };
}

export function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
