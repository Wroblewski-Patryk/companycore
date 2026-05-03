import type { Prisma } from "@prisma/client";
import type {
  ClickUpClient,
  ClickUpCustomField,
  ClickUpFolderSummary,
  ClickUpListSummary,
  ClickUpSpaceSummary,
  ClickUpViewSummary,
  ClickUpWorkspaceSummary
} from "../integrations/clickup/clickup.client";
import { prisma } from "../db/prisma";
import { classifyOperatingAreaKey, ensureOperatingModelForWorkspace } from "./catalog";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function areaForNames(workspaceId: string, ...names: Array<string | null | undefined>) {
  const key = classifyOperatingAreaKey(...names);
  return prisma.operatingArea.findUniqueOrThrow({
    where: {
      workspaceId_key: {
        workspaceId,
        key
      }
    }
  });
}

async function upsertContainerMapping(input: {
  workspaceId: string;
  entityType: string;
  externalId: string;
  name?: string | null;
  areaId?: string | null;
  folderId?: string | null;
  tableId?: string | null;
  raw?: Prisma.InputJsonValue;
}) {
  const existing = await prisma.externalContainerMapping.findUnique({
    where: {
      workspaceId_provider_entityType_externalId: {
        workspaceId: input.workspaceId,
        provider: "clickup",
        entityType: input.entityType,
        externalId: input.externalId
      }
    }
  });
  const existingRaw = existing?.raw && typeof existing.raw === "object" && !Array.isArray(existing.raw)
    ? existing.raw as Record<string, unknown>
    : {};
  const manualAreaId = typeof existingRaw.manualAreaId === "string" ? existingRaw.manualAreaId : null;
  const nextAreaId = manualAreaId ?? input.areaId;
  const nextRaw = {
    ...(input.raw && typeof input.raw === "object" && !Array.isArray(input.raw) ? input.raw as Record<string, unknown> : {}),
    ...(manualAreaId ? { manualAreaId } : {})
  };

  await prisma.externalContainerMapping.upsert({
    where: {
      workspaceId_provider_entityType_externalId: {
        workspaceId: input.workspaceId,
        provider: "clickup",
        entityType: input.entityType,
        externalId: input.externalId
      }
    },
    update: {
      name: input.name,
      areaId: nextAreaId,
      folderId: input.folderId,
      tableId: input.tableId,
      raw: nextRaw as Prisma.InputJsonValue
    },
    create: {
      workspaceId: input.workspaceId,
      provider: "clickup",
      entityType: input.entityType,
      externalId: input.externalId,
      name: input.name,
      areaId: nextAreaId,
      folderId: input.folderId,
      tableId: input.tableId,
      raw: nextRaw as Prisma.InputJsonValue
    }
  });
}

async function upsertFieldMapping(input: {
  workspaceId: string;
  field: ClickUpCustomField;
  tableId?: string | null;
  nativeField?: string | null;
}) {
  await prisma.externalFieldMapping.upsert({
    where: {
      workspaceId_provider_externalId: {
        workspaceId: input.workspaceId,
        provider: "clickup",
        externalId: input.field.id
      }
    },
    update: {
      name: input.field.name,
      fieldType: input.field.type ?? null,
      tableId: input.tableId ?? null,
      nativeField: input.nativeField ?? null,
      typeConfig: input.field.type_config as Prisma.InputJsonValue | undefined
    },
    create: {
      workspaceId: input.workspaceId,
      provider: "clickup",
      externalId: input.field.id,
      name: input.field.name,
      fieldType: input.field.type ?? null,
      tableId: input.tableId ?? null,
      nativeField: input.nativeField ?? null,
      typeConfig: input.field.type_config as Prisma.InputJsonValue | undefined
    }
  });
}

async function upsertViewMapping(input: {
  workspaceId: string;
  view: ClickUpViewSummary;
  areaId?: string | null;
  folderId?: string | null;
  tableId?: string | null;
}) {
  await upsertContainerMapping({
    workspaceId: input.workspaceId,
    entityType: "view",
    externalId: input.view.id,
    name: input.view.name,
    areaId: input.areaId,
    folderId: input.folderId,
    tableId: input.tableId,
    raw: {
      id: input.view.id,
      name: input.view.name,
      type: input.view.type ?? null,
      parent: input.view.parent ?? null
    }
  });
}

async function upsertClickUpListTable(input: {
  workspaceId: string;
  areaId: string;
  folderId?: string | null;
  list: ClickUpListSummary;
  spaceName?: string;
  folderName?: string | null;
}) {
  const existingTable = await prisma.operatingTable.findUnique({
    where: {
      workspaceId_source_externalId: {
        workspaceId: input.workspaceId,
        source: "clickup",
        externalId: input.list.id
      }
    },
    select: {
      syncPolicy: true
    }
  });
  const existingPolicy = existingTable?.syncPolicy && typeof existingTable.syncPolicy === "object" && !Array.isArray(existingTable.syncPolicy)
    ? existingTable.syncPolicy as Record<string, unknown>
    : {};
  const manualAreaId = typeof existingPolicy.manualAreaId === "string" ? existingPolicy.manualAreaId : null;
  const nextAreaId = manualAreaId ?? input.areaId;
  const syncPolicy = {
    provider: "clickup",
    entityType: "list",
    externalId: input.list.id,
    sourceNames: {
      space: input.spaceName ?? null,
      folder: input.folderName ?? null
    },
    ...(manualAreaId ? { manualAreaId } : {})
  };
  const baseSlug = slugify(input.list.name) || input.list.id;
  const table = await prisma.operatingTable.upsert({
    where: {
      workspaceId_source_externalId: {
        workspaceId: input.workspaceId,
        source: "clickup",
        externalId: input.list.id
      }
    },
    update: {
      areaId: nextAreaId,
      folderId: input.folderId,
      tableName: `clickup_list_${input.list.id}`,
      apiSlug: `clickup-${baseSlug}-${input.list.id}`,
      name: input.list.name,
      description: "ClickUp List mapped as an operating table",
      syncPolicy
    },
    create: {
      workspaceId: input.workspaceId,
      areaId: nextAreaId,
      folderId: input.folderId,
      tableName: `clickup_list_${input.list.id}`,
      apiSlug: `clickup-${baseSlug}-${input.list.id}`,
      name: input.list.name,
      description: "ClickUp List mapped as an operating table",
      source: "clickup",
      externalId: input.list.id,
      syncPolicy
    }
  });

  await upsertContainerMapping({
    workspaceId: input.workspaceId,
    entityType: "list",
    externalId: input.list.id,
    name: input.list.name,
    areaId: nextAreaId,
    folderId: input.folderId,
    tableId: table.id,
    raw: {
      id: input.list.id,
      name: input.list.name,
      spaceName: input.spaceName ?? null,
      folderName: input.folderName ?? null
    }
  });

  return table;
}

async function upsertClickUpFolder(input: {
  workspaceId: string;
  areaId: string;
  folder: ClickUpFolderSummary;
  spaceName?: string;
}) {
  const existingFolderMapping = await prisma.externalContainerMapping.findUnique({
    where: {
      workspaceId_provider_entityType_externalId: {
        workspaceId: input.workspaceId,
        provider: "clickup",
        entityType: "folder",
        externalId: input.folder.id
      }
    }
  });
  const existingRaw = existingFolderMapping?.raw && typeof existingFolderMapping.raw === "object" && !Array.isArray(existingFolderMapping.raw)
    ? existingFolderMapping.raw as Record<string, unknown>
    : {};
  const manualAreaId = typeof existingRaw.manualAreaId === "string" ? existingRaw.manualAreaId : null;
  const nextAreaId = manualAreaId ?? input.areaId;
  const folder = await prisma.operatingFolder.upsert({
    where: {
      workspaceId_source_externalId: {
        workspaceId: input.workspaceId,
        source: "clickup",
        externalId: input.folder.id
      }
    },
    update: {
      areaId: nextAreaId,
      key: `clickup-folder-${input.folder.id}`,
      name: input.folder.name,
      description: "ClickUp Folder mapped as an operating folder"
    },
    create: {
      workspaceId: input.workspaceId,
      areaId: nextAreaId,
      key: `clickup-folder-${input.folder.id}`,
      name: input.folder.name,
      description: "ClickUp Folder mapped as an operating folder",
      source: "clickup",
      externalId: input.folder.id
    }
  });

  await upsertContainerMapping({
    workspaceId: input.workspaceId,
    entityType: "folder",
    externalId: input.folder.id,
    name: input.folder.name,
    areaId: nextAreaId,
    folderId: folder.id,
    raw: {
      id: input.folder.id,
      name: input.folder.name,
      spaceName: input.spaceName ?? null
    }
  });

  return folder;
}

export async function persistClickUpStructure(input: {
  workspaceId: string;
  selectedWorkspace: ClickUpWorkspaceSummary | null;
  spaces: ClickUpSpaceSummary[];
  client?: ClickUpClient;
}) {
  await ensureOperatingModelForWorkspace(prisma, input.workspaceId);

  if (input.selectedWorkspace) {
    await upsertContainerMapping({
      workspaceId: input.workspaceId,
      entityType: "workspace",
      externalId: input.selectedWorkspace.id,
      name: input.selectedWorkspace.name,
      raw: input.selectedWorkspace
    });

    if (input.client) {
      const [workspaceFields, workspaceViews] = await Promise.all([
        input.client.getWorkspaceCustomFields(input.selectedWorkspace.id),
        input.client.getWorkspaceViews(input.selectedWorkspace.id)
      ]);

      for (const field of workspaceFields) {
        await upsertFieldMapping({
          workspaceId: input.workspaceId,
          field
        });
      }

      for (const view of workspaceViews) {
        await upsertViewMapping({
          workspaceId: input.workspaceId,
          view
        });
      }
    }
  }

  for (const space of input.spaces) {
    const area = await areaForNames(input.workspaceId, space.name);

    await upsertContainerMapping({
      workspaceId: input.workspaceId,
      entityType: "space",
      externalId: space.id,
      name: space.name,
      areaId: area.id,
      raw: {
        id: space.id,
        name: space.name
      }
    });

    if (input.client) {
      const spaceFields = await input.client.getSpaceCustomFields(space.id);
      for (const field of spaceFields) {
        await upsertFieldMapping({
          workspaceId: input.workspaceId,
          field
        });
      }
    }

    for (const list of space.lists) {
      const listArea = await areaForNames(input.workspaceId, space.name, list.name);
      const table = await upsertClickUpListTable({
        workspaceId: input.workspaceId,
        areaId: listArea.id,
        list,
        spaceName: space.name
      });

      if (input.client) {
        const [listFields, listViews] = await Promise.all([
          input.client.getListCustomFields(list.id),
          input.client.getListViews(list.id)
        ]);

        for (const field of listFields) {
          await upsertFieldMapping({
            workspaceId: input.workspaceId,
            field,
            tableId: table.id
          });
        }

        for (const view of listViews) {
          await upsertViewMapping({
            workspaceId: input.workspaceId,
            view,
            areaId: table.areaId,
            folderId: table.folderId,
            tableId: table.id
          });
        }
      }
    }

    for (const folder of space.folders) {
      const folderArea = await areaForNames(input.workspaceId, space.name, folder.name);
      const operatingFolder = await upsertClickUpFolder({
        workspaceId: input.workspaceId,
        areaId: folderArea.id,
        folder,
        spaceName: space.name
      });

      if (input.client) {
        const folderFields = await input.client.getFolderCustomFields(folder.id);
        for (const field of folderFields) {
          await upsertFieldMapping({
            workspaceId: input.workspaceId,
            field
          });
        }
      }

      for (const list of folder.lists) {
        const listArea = await areaForNames(input.workspaceId, space.name, folder.name, list.name);
        const table = await upsertClickUpListTable({
          workspaceId: input.workspaceId,
          areaId: listArea.id,
          folderId: operatingFolder.id,
          list,
          spaceName: space.name,
          folderName: folder.name
        });

        if (input.client) {
          const [listFields, listViews] = await Promise.all([
            input.client.getListCustomFields(list.id),
            input.client.getListViews(list.id)
          ]);

          for (const field of listFields) {
            await upsertFieldMapping({
              workspaceId: input.workspaceId,
              field,
              tableId: table.id
            });
          }

          for (const view of listViews) {
            await upsertViewMapping({
              workspaceId: input.workspaceId,
              view,
              areaId: table.areaId,
              folderId: table.folderId,
              tableId: table.id
            });
          }
        }
      }
    }
  }
}

export async function findClickUpListTable(workspaceId: string, listId: string) {
  return prisma.operatingTable.findUnique({
    where: {
      workspaceId_source_externalId: {
        workspaceId,
        source: "clickup",
        externalId: listId
      }
    },
    select: {
      id: true,
      name: true,
      folderId: true,
      areaId: true
    }
  });
}
