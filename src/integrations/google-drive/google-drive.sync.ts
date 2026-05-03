import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { createEvent } from "../../modules/events/event.service";
import { IntegrationError } from "../errors";
import { getGoogleDriveSettingsForWorkspace } from "../integration-settings.service";
import { GoogleDriveClient } from "./google-drive.client";

export type GoogleDriveNoteSyncOptions = {
  push?: boolean;
};

function driveNoteName(noteId: string) {
  return `companycore-note-${noteId}.txt`;
}

function safeDriveFilePayload(file: { id: string; name: string; mimeType?: string; modifiedTime?: string; webViewLink?: string }) {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink
  } as Prisma.InputJsonValue;
}

export async function createOrUpdateGoogleDriveFileForNote(input: {
  workspaceId: string;
  noteId: string;
  externalId?: string | null;
  content: string;
}) {
  const settings = await getGoogleDriveSettingsForWorkspace(input.workspaceId);
  if (!settings) {
    throw new IntegrationError("integration_not_configured", 400, "Google Drive integration is not configured for this workspace.");
  }
  if (!settings.config.rootFolderId) {
    throw new IntegrationError("integration_not_configured", 400, "Google Drive rootFolderId is required before note sync.");
  }

  const client = new GoogleDriveClient(settings.token);
  if (input.externalId) {
    await client.updateTextFile(input.externalId, input.content);
    return { id: input.externalId };
  }

  return client.createTextFile({
    folderId: settings.config.rootFolderId,
    name: driveNoteName(input.noteId),
    content: input.content
  });
}

export async function syncGoogleDriveNotesForWorkspace(
  workspaceId: string,
  options: GoogleDriveNoteSyncOptions = {}
) {
  const settings = await getGoogleDriveSettingsForWorkspace(workspaceId);
  if (!settings) {
    throw new IntegrationError("integration_not_configured", 400, "Google Drive integration is not configured for this workspace.");
  }
  if (!settings.config.rootFolderId) {
    throw new IntegrationError("integration_not_configured", 400, "Google Drive rootFolderId is required before note sync.");
  }

  const client = new GoogleDriveClient(settings.token);
  const result = {
    provider: "google_drive",
    importedCount: 0,
    exportedCount: 0,
    updatedCount: 0,
    skippedCount: 0
  };

  await createEvent({
    type: "google_drive_sync_started",
    workspaceId,
    source: "google_drive",
    payload: {
      provider: "google_drive",
      rootFolderId: settings.config.rootFolderId,
      push: Boolean(options.push || settings.config.pushNotesToDrive)
    }
  });

  const files = await client.listTextFilesInFolder(
    settings.config.rootFolderId,
    settings.config.includeGoogleDocs ?? true
  );

  for (const file of files) {
    const content = await client.downloadText(file);
    const existing = await prisma.note.findUnique({
      where: {
        workspaceId_source_externalId: {
          workspaceId,
          source: "google_drive",
          externalId: file.id
        }
      }
    });

    const note = await prisma.note.upsert({
      where: {
        workspaceId_source_externalId: {
          workspaceId,
          source: "google_drive",
          externalId: file.id
        }
      },
      update: {
        content
      },
      create: {
        workspaceId,
        content,
        source: "google_drive",
        externalId: file.id
      }
    });

    if (existing) {
      result.updatedCount += 1;
    } else {
      result.importedCount += 1;
    }

    await createEvent({
      type: "note_synced_from_google_drive",
      workspaceId,
      source: "google_drive",
      payload: {
        provider: "google_drive",
        noteId: note.id,
        externalId: file.id,
        raw: safeDriveFilePayload(file)
      }
    });
  }

  if (options.push || settings.config.pushNotesToDrive) {
    const localNotes = await prisma.note.findMany({
      where: {
        workspaceId,
        OR: [
          { source: "companycore" },
          { source: null }
        ],
        externalId: null
      },
      orderBy: { createdAt: "asc" }
    });

    for (const note of localNotes) {
      const file = await client.createTextFile({
        folderId: settings.config.rootFolderId,
        name: driveNoteName(note.id),
        content: note.content
      });
      await prisma.note.update({
        where: {
          id: note.id,
          workspaceId
        },
        data: {
          source: "google_drive",
          externalId: file.id
        }
      });
      result.exportedCount += 1;

      await createEvent({
        type: "note_exported_to_google_drive",
        workspaceId,
        source: "google_drive",
        payload: {
          provider: "google_drive",
          noteId: note.id,
          externalId: file.id,
          raw: safeDriveFilePayload(file)
        }
      });
    }
  }

  await createEvent({
    type: "google_drive_sync_succeeded",
    workspaceId,
    source: "google_drive",
    payload: result as Prisma.InputJsonValue
  });

  return result;
}
