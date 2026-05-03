import { prisma } from "../../db/prisma";
import { IntegrationError } from "../errors";
import { getGoogleDriveSettingsForWorkspace, toJsonInput, type GoogleDriveIntegrationConfig } from "../integration-settings.service";
import { GoogleDriveClient, type GoogleDriveFileMetadata } from "./google-drive.client";

export type GoogleDriveImportMode = "merge" | "skip_existing" | "replace_selected_folders" | "inspect_only";

export type GoogleDriveImportResult = {
  provider: "google_drive";
  importMode: GoogleDriveImportMode;
  folderIds: string[];
  itemCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  deletedCount: number;
  wouldCreateCount: number;
  wouldUpdateCount: number;
};

export async function importGoogleDriveFoldersForWorkspace(input: {
  workspaceId: string;
  folderIds?: string[];
  importMode?: GoogleDriveImportMode;
  maxPagesPerFolder?: number;
}): Promise<GoogleDriveImportResult> {
  const settings = await getGoogleDriveSettingsForWorkspace(input.workspaceId);

  if (!settings) {
    throw new IntegrationError(
      "integration_not_configured",
      404,
      "Google Drive is not configured for this workspace."
    );
  }

  if (!settings.oauth.accessToken) {
    throw new IntegrationError(
      "integration_invalid_token",
      401,
      "Google Drive access token is required before folder import can run."
    );
  }

  const config = settings.config ?? {};
  const folderIds = uniqueNonEmpty(input.folderIds ?? config.selectedFolderIds ?? config.rootFolderIds ?? []);
  if (folderIds.length === 0) {
    throw new IntegrationError(
      "sync_failed",
      422,
      "At least one Google Drive folder must be selected before import."
    );
  }

  const importMode = input.importMode ?? config.importMode ?? "merge";
  const client = new GoogleDriveClient(settings.oauth.accessToken);
  const files = await fetchSelectedFolderFiles({
    client,
    folderIds,
    maxPagesPerFolder: input.maxPagesPerFolder
  });
  const existing = await prisma.googleDriveFile.findMany({
    where: {
      workspaceId: input.workspaceId,
      provider: "google_drive",
      externalId: { in: files.map((file) => file.id) }
    },
    select: {
      id: true,
      externalId: true
    }
  });
  const existingByExternalId = new Map(existing.map((file) => [file.externalId, file.id]));
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let deletedCount = 0;
  let wouldCreateCount = 0;
  let wouldUpdateCount = 0;

  for (const file of files) {
    if (existingByExternalId.has(file.id)) {
      wouldUpdateCount += 1;
    } else {
      wouldCreateCount += 1;
    }
  }

  if (importMode === "inspect_only") {
    skippedCount = files.length;
    await emitGoogleDriveImportEvent(input.workspaceId, {
      provider: "google_drive",
      importMode,
      folderIds,
      itemCount: files.length,
      createdCount,
      updatedCount,
      skippedCount,
      deletedCount,
      wouldCreateCount,
      wouldUpdateCount
    });
    return {
      provider: "google_drive",
      importMode,
      folderIds,
      itemCount: files.length,
      createdCount,
      updatedCount,
      skippedCount,
      deletedCount,
      wouldCreateCount,
      wouldUpdateCount
    };
  }

  if (importMode === "replace_selected_folders") {
    const deleted = await prisma.googleDriveFile.deleteMany({
      where: {
        workspaceId: input.workspaceId,
        provider: "google_drive",
        parentExternalId: { in: folderIds }
      }
    });
    deletedCount = deleted.count;
    existingByExternalId.clear();
  }

  for (const file of files) {
    const existingId = existingByExternalId.get(file.id);
    if (importMode === "skip_existing" && existingId) {
      skippedCount += 1;
      continue;
    }

    await prisma.googleDriveFile.upsert({
      where: {
        workspaceId_provider_externalId: {
          workspaceId: input.workspaceId,
          provider: "google_drive",
          externalId: file.id
        }
      },
      create: toGoogleDriveFileCreate(input.workspaceId, file, config),
      update: toGoogleDriveFileUpdate(file, config)
    });

    if (existingId) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }
  }

  const result = {
    provider: "google_drive" as const,
    importMode,
    folderIds,
    itemCount: files.length,
    createdCount,
    updatedCount,
    skippedCount,
    deletedCount,
    wouldCreateCount,
    wouldUpdateCount
  };
  await emitGoogleDriveImportEvent(input.workspaceId, result);
  return result;
}

async function fetchSelectedFolderFiles(input: {
  client: GoogleDriveClient;
  folderIds: string[];
  maxPagesPerFolder?: number;
}) {
  const files: GoogleDriveFileMetadata[] = [];
  const seen = new Set<string>();

  for (const folderId of input.folderIds) {
    let pageToken: string | undefined;
    for (let page = 0; page < (input.maxPagesPerFolder ?? 10); page += 1) {
      const response = await input.client.listFiles({
        query: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
        pageToken
      });

      for (const file of response.files ?? []) {
        if (!file.id || seen.has(file.id)) {
          continue;
        }
        seen.add(file.id);
        files.push(file);
      }

      if (!response.nextPageToken) {
        break;
      }
      pageToken = response.nextPageToken;
    }
  }

  return files;
}

function toGoogleDriveFileCreate(
  workspaceId: string,
  file: GoogleDriveFileMetadata,
  config: GoogleDriveIntegrationConfig
) {
  return {
    ...toGoogleDriveFileUpdate(file, config),
    workspaceId,
    externalId: file.id
  };
}

function toGoogleDriveFileUpdate(file: GoogleDriveFileMetadata, config: GoogleDriveIntegrationConfig) {
  const scopeMapping = findScopeMapping(file, config);
  return {
    provider: "google_drive",
    name: file.name,
    mimeType: file.mimeType,
    driveId: file.driveId,
    parentExternalId: file.parents?.[0],
    isFolder: file.mimeType === "application/vnd.google-apps.folder",
    trashed: Boolean(file.trashed),
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    iconLink: file.iconLink,
    thumbnailLink: file.thumbnailLink,
    size: file.size,
    headRevisionId: file.headRevisionId,
    md5Checksum: file.md5Checksum,
    modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
    operatingAreaId: scopeMapping?.operatingAreaId,
    operatingFolderId: scopeMapping?.operatingFolderId,
    operatingTableId: scopeMapping?.operatingTableId,
    storageLocationId: scopeMapping?.storageLocationId,
    knowledgeRootId: scopeMapping?.knowledgeRootId,
    syncStatus: "synced",
    lastSyncedAt: new Date(),
    rawMetadata: toJsonInput(file)
  };
}

function findScopeMapping(file: GoogleDriveFileMetadata, config: GoogleDriveIntegrationConfig) {
  const parentId = file.parents?.[0];
  if (!parentId) {
    return null;
  }
  return config.operatingScopeMappings?.find((mapping) => mapping.folderId === parentId) ?? null;
}

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

async function emitGoogleDriveImportEvent(workspaceId: string, result: GoogleDriveImportResult) {
  await prisma.event.create({
    data: {
      workspaceId,
      type: "google_drive_import_succeeded",
      source: "google_drive",
      payload: toJsonInput(result)
    }
  });
}
