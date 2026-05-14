import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { ensureOperatingModelForWorkspace } from "../../operating-model/catalog";

const uuidSchema = z.string().uuid();

const scopedResourceSchema = z.object({
  areaId: uuidSchema.optional(),
  folderId: uuidSchema.optional(),
  tableId: uuidSchema.optional()
}).strict();

const externalMappingScopeSchema = z.object({
  areaId: uuidSchema,
  applyToChildren: z.boolean().optional()
}).strict();

const operatingAreaSchema = z.object({
  key: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  position: z.coerce.number().int().optional()
}).strict();

const updateOperatingAreaSchema = operatingAreaSchema.partial().omit({
  key: true
});

const deleteOperatingAreaSchema = z.object({
  reassignToAreaId: uuidSchema
}).strict();

const storageLocationSchema = scopedResourceSchema.extend({
  provider: z.string().min(1),
  name: z.string().min(1),
  locator: z.record(z.unknown())
}).strict();

const updateStorageLocationSchema = storageLocationSchema.partial();

const knowledgeRootSchema = scopedResourceSchema.extend({
  provider: z.string().min(1),
  name: z.string().min(1),
  locator: z.record(z.unknown())
}).strict();

const updateKnowledgeRootSchema = knowledgeRootSchema.partial();

const automationDefinitionSchema = scopedResourceSchema.extend({
  provider: z.string().min(1).optional(),
  triggerType: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional()
}).strict();

const updateAutomationDefinitionSchema = automationDefinitionSchema.partial();

const operatingFolderSchema = z.object({
  areaId: uuidSchema,
  key: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  source: z.string().min(1).optional(),
  externalId: z.string().min(1).optional()
}).strict();

const updateOperatingFolderSchema = operatingFolderSchema.partial().omit({
  source: true,
  externalId: true
});

export const operatingModelRouter = Router();

function slugifyKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "folder";
}

async function uniqueAreaKey(workspaceId: string, base: string) {
  const root = slugifyKey(base);
  let key = root;
  let suffix = 2;

  while (await prisma.operatingArea.findFirst({ where: { workspaceId, key }, select: { id: true } })) {
    key = `${root}-${suffix}`;
    suffix += 1;
  }

  return key;
}

async function assertScope(workspaceId: string, input: {
  areaId?: string;
  folderId?: string;
  tableId?: string;
}) {
  const [area, folder, table] = await Promise.all([
    input.areaId
      ? prisma.operatingArea.findFirst({ where: { id: input.areaId, workspaceId }, select: { id: true } })
      : Promise.resolve(null),
    input.folderId
      ? prisma.operatingFolder.findFirst({ where: { id: input.folderId, workspaceId }, select: { id: true, areaId: true } })
      : Promise.resolve(null),
    input.tableId
      ? prisma.operatingTable.findFirst({ where: { id: input.tableId, workspaceId }, select: { id: true, areaId: true, folderId: true } })
      : Promise.resolve(null)
  ]);

  if ((input.areaId && !area) || (input.folderId && !folder) || (input.tableId && !table)) {
    return false;
  }

  if (area && folder && folder.areaId !== area.id) {
    return false;
  }

  if (area && table && table.areaId !== area.id) {
    return false;
  }

  if (folder && table && table.folderId !== folder.id) {
    return false;
  }

  return true;
}

operatingModelRouter.get("/", asyncHandler(async (req, res) => {
  const workspaceId = req.auth!.workspaceId;
  await ensureOperatingModelForWorkspace(prisma, workspaceId);
  const [
    areas,
    externalMappings,
    externalFields,
    storageLocations,
    knowledgeRoots,
    automationDefinitions
  ] = await Promise.all([
    prisma.operatingArea.findMany({
      where: { workspaceId },
      orderBy: { position: "asc" },
      include: {
        folders: { orderBy: { name: "asc" } },
        tables: { orderBy: { apiSlug: "asc" } }
      }
    }),
    prisma.externalContainerMapping.findMany({
      where: { workspaceId },
      orderBy: [{ provider: "asc" }, { entityType: "asc" }, { name: "asc" }]
    }),
    prisma.externalFieldMapping.findMany({
      where: { workspaceId },
      orderBy: [{ provider: "asc" }, { name: "asc" }]
    }),
    prisma.storageLocation.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.knowledgeRoot.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.automationDefinition.findMany({ where: { workspaceId }, orderBy: { name: "asc" } })
  ]);

  res.json({
    data: {
      hierarchy: "workspace -> operating_area -> operating_folder -> operating_table -> record",
      areas,
      externalMappings,
      externalFields,
      storageLocations,
      knowledgeRoots,
      automationDefinitions
    }
  });
}));

operatingModelRouter.get("/tables", asyncHandler(async (req, res) => {
  const tables = await prisma.operatingTable.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: [{ source: "asc" }, { apiSlug: "asc" }],
    include: {
      area: true,
      folder: true
    }
  });

  res.json({ data: tables });
}));

operatingModelRouter.get("/areas", asyncHandler(async (req, res) => {
  await ensureOperatingModelForWorkspace(prisma, req.auth!.workspaceId);
  const areas = await prisma.operatingArea.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { position: "asc" },
    include: {
      folders: { orderBy: { name: "asc" } },
      tables: { orderBy: { apiSlug: "asc" } }
    }
  });

  res.json({ data: areas });
}));

operatingModelRouter.get("/area-inventory", asyncHandler(async (req, res) => {
  const workspaceId = req.auth!.workspaceId;
  await ensureOperatingModelForWorkspace(prisma, workspaceId);

  const [
    areas,
    externalMappings,
    driveFiles,
    storageLocations,
    knowledgeRoots,
    automationDefinitions
  ] = await Promise.all([
    prisma.operatingArea.findMany({
      where: { workspaceId },
      orderBy: { position: "asc" },
      include: {
        folders: { select: { id: true } },
        tables: { select: { id: true, apiSlug: true, name: true } }
      }
    }),
    prisma.externalContainerMapping.groupBy({
      by: ["areaId"],
      where: { workspaceId },
      _count: { _all: true }
    }),
    prisma.googleDriveFile.groupBy({
      by: ["operatingAreaId"],
      where: { workspaceId, operatingAreaId: { not: null } },
      _count: { _all: true }
    }),
    prisma.storageLocation.groupBy({
      by: ["areaId"],
      where: { workspaceId, areaId: { not: null } },
      _count: { _all: true }
    }),
    prisma.knowledgeRoot.groupBy({
      by: ["areaId"],
      where: { workspaceId, areaId: { not: null } },
      _count: { _all: true }
    }),
    prisma.automationDefinition.groupBy({
      by: ["areaId"],
      where: { workspaceId, areaId: { not: null } },
      _count: { _all: true }
    })
  ]);

  const countById = <T extends { _count: { _all: number } }>(
    rows: T[],
    id: (row: T) => string | null
  ) => new Map(rows.flatMap((row) => {
    const key = id(row);
    return key ? [[key, row._count._all] as const] : [];
  }));

  const externalMappingCounts = countById(externalMappings, (row) => row.areaId);
  const driveFileCounts = countById(driveFiles, (row) => row.operatingAreaId);
  const storageCounts = countById(storageLocations, (row) => row.areaId);
  const knowledgeCounts = countById(knowledgeRoots, (row) => row.areaId);
  const automationCounts = countById(automationDefinitions, (row) => row.areaId);

  res.json({
    data: areas.map((area) => ({
      id: area.id,
      key: area.key,
      name: area.name,
      position: area.position,
      isSystem: area.isSystem,
      resources: {
        folders: area.folders.length,
        tables: area.tables.length,
        externalMappings: externalMappingCounts.get(area.id) ?? 0,
        driveFiles: driveFileCounts.get(area.id) ?? 0,
        storageLocations: storageCounts.get(area.id) ?? 0,
        knowledgeRoots: knowledgeCounts.get(area.id) ?? 0,
        automationDefinitions: automationCounts.get(area.id) ?? 0
      },
      tables: area.tables.map((table) => ({
        id: table.id,
        apiSlug: table.apiSlug,
        name: table.name
      }))
    }))
  });
}));

operatingModelRouter.post("/areas", asyncHandler(async (req, res) => {
  const input = operatingAreaSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;
  const key = input.key
    ? await uniqueAreaKey(workspaceId, input.key)
    : await uniqueAreaKey(workspaceId, input.name);
  const maxPosition = await prisma.operatingArea.aggregate({
    where: { workspaceId },
    _max: { position: true }
  });

  const area = await prisma.operatingArea.create({
    data: {
      workspaceId,
      key,
      name: input.name,
      description: input.description,
      position: input.position ?? ((maxPosition._max.position ?? 12) + 1),
      isSystem: false
    }
  });

  res.status(201).json({ data: area });
}));

operatingModelRouter.patch("/areas/:id", asyncHandler(async (req, res) => {
  const input = updateOperatingAreaSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;
  const existing = await prisma.operatingArea.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  if (existing.isSystem) {
    return res.status(403).json({ error: "system_area_protected" });
  }

  const area = await prisma.operatingArea.update({
    where: { id: existing.id },
    data: input
  });

  res.json({ data: area });
}));

operatingModelRouter.delete("/areas/:id", asyncHandler(async (req, res) => {
  const input = deleteOperatingAreaSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;
  const existing = await prisma.operatingArea.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  if (existing.isSystem || existing.key === "main-general") {
    return res.status(403).json({ error: "system_area_protected" });
  }

  if (input.reassignToAreaId === existing.id) {
    return res.status(409).json({ error: "conflict" });
  }

  const target = await prisma.operatingArea.findFirst({
    where: { id: input.reassignToAreaId, workspaceId },
    select: { id: true }
  });

  if (!target) {
    return res.status(404).json({ error: "not_found" });
  }

  await prisma.$transaction([
    prisma.operatingFolder.updateMany({
      where: { workspaceId, areaId: existing.id },
      data: { areaId: target.id }
    }),
    prisma.operatingTable.updateMany({
      where: { workspaceId, areaId: existing.id },
      data: { areaId: target.id }
    }),
    prisma.externalContainerMapping.updateMany({
      where: { workspaceId, areaId: existing.id },
      data: { areaId: target.id }
    }),
    prisma.storageLocation.updateMany({
      where: { workspaceId, areaId: existing.id },
      data: { areaId: target.id }
    }),
    prisma.knowledgeRoot.updateMany({
      where: { workspaceId, areaId: existing.id },
      data: { areaId: target.id }
    }),
    prisma.automationDefinition.updateMany({
      where: { workspaceId, areaId: existing.id },
      data: { areaId: target.id }
    }),
    prisma.googleDriveFile.updateMany({
      where: { workspaceId, operatingAreaId: existing.id },
      data: { operatingAreaId: target.id }
    }),
    prisma.operatingArea.delete({
      where: { id: existing.id }
    })
  ]);

  res.json({
    data: {
      id: existing.id,
      deleted: true,
      reassignedToAreaId: target.id
    }
  });
}));

operatingModelRouter.get("/folders", asyncHandler(async (req, res) => {
  const folders = await prisma.operatingFolder.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: [{ name: "asc" }],
    include: { area: true }
  });

  res.json({ data: folders });
}));

operatingModelRouter.get("/folders/:id", asyncHandler(async (req, res) => {
  const folder = await prisma.operatingFolder.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId },
    include: { area: true }
  });

  if (!folder) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: folder });
}));

operatingModelRouter.post("/folders", asyncHandler(async (req, res) => {
  const input = operatingFolderSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  if (!(await assertScope(workspaceId, { areaId: input.areaId }))) {
    return res.status(404).json({ error: "not_found" });
  }

  const folder = await prisma.operatingFolder.create({
    data: {
      workspaceId,
      areaId: input.areaId,
      key: input.key ?? slugifyKey(input.name),
      name: input.name,
      description: input.description,
      source: input.source,
      externalId: input.externalId
    }
  });

  res.status(201).json({ data: folder });
}));

operatingModelRouter.patch("/folders/:id", asyncHandler(async (req, res) => {
  const input = updateOperatingFolderSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  if (!(await assertScope(workspaceId, { areaId: input.areaId }))) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.operatingFolder.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const folder = await prisma.operatingFolder.update({
    where: { id: existing.id },
    data: input
  });

  res.json({ data: folder });
}));

operatingModelRouter.delete("/folders/:id", asyncHandler(async (req, res) => {
  const workspaceId = req.auth!.workspaceId;
  const existing = await prisma.operatingFolder.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const dependentCount = await prisma.operatingTable.count({
    where: { workspaceId, folderId: existing.id }
  });
  if (dependentCount > 0) {
    return res.status(409).json({ error: "conflict" });
  }

  await prisma.operatingFolder.delete({ where: { id: existing.id } });
  res.json({ data: { id: existing.id, deleted: true } });
}));

operatingModelRouter.get("/external-mappings", asyncHandler(async (req, res) => {
  const mappings = await prisma.externalContainerMapping.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: [{ provider: "asc" }, { entityType: "asc" }, { name: "asc" }]
  });

  res.json({ data: mappings });
}));

operatingModelRouter.patch("/external-mappings/:id/scope", asyncHandler(async (req, res) => {
  const input = externalMappingScopeSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;
  const mappingId = uuidSchema.parse(req.params.id);

  const area = await prisma.operatingArea.findFirst({
    where: { id: input.areaId, workspaceId },
    select: { id: true }
  });
  if (!area) {
    return res.status(404).json({ error: "not_found" });
  }

  const mapping = await prisma.externalContainerMapping.findFirst({
    where: { id: mappingId, workspaceId }
  });
  if (!mapping) {
    return res.status(404).json({ error: "not_found" });
  }

  const raw = mapping.raw && typeof mapping.raw === "object" && !Array.isArray(mapping.raw)
    ? mapping.raw as Record<string, unknown>
    : {};

  const updated = await prisma.externalContainerMapping.update({
    where: { id: mapping.id },
    data: {
      areaId: area.id,
      raw: {
        ...raw,
        manualAreaId: area.id
      } as Prisma.InputJsonValue
    }
  });

  if (mapping.provider === "clickup" && mapping.entityType === "list" && mapping.tableId) {
    const table = await prisma.operatingTable.findFirst({
      where: { id: mapping.tableId, workspaceId }
    });
    const policy = table?.syncPolicy && typeof table.syncPolicy === "object" && !Array.isArray(table.syncPolicy)
      ? table.syncPolicy as Record<string, unknown>
      : {};
    await prisma.operatingTable.updateMany({
      where: { id: mapping.tableId, workspaceId },
      data: {
        areaId: area.id,
        syncPolicy: {
          ...policy,
          manualAreaId: area.id
        } as Prisma.InputJsonValue
      }
    });
  }

  if (mapping.provider === "clickup" && mapping.entityType === "folder" && mapping.folderId) {
    await prisma.operatingFolder.updateMany({
      where: { id: mapping.folderId, workspaceId },
      data: { areaId: area.id }
    });

    if (input.applyToChildren ?? true) {
      const childTables = await prisma.operatingTable.findMany({
        where: { workspaceId, folderId: mapping.folderId, source: "clickup" },
        select: { id: true, syncPolicy: true }
      });
      for (const table of childTables) {
        const policy = table.syncPolicy && typeof table.syncPolicy === "object" && !Array.isArray(table.syncPolicy)
          ? table.syncPolicy as Record<string, unknown>
          : {};
        await prisma.operatingTable.update({
          where: { id: table.id },
          data: {
            areaId: area.id,
            syncPolicy: {
              ...policy,
              manualAreaId: area.id
            } as Prisma.InputJsonValue
          }
        });
      }
      await prisma.externalContainerMapping.updateMany({
        where: {
          workspaceId,
          provider: "clickup",
          entityType: "list",
          tableId: { in: childTables.map((table) => table.id) }
        },
        data: { areaId: area.id }
      });
    }
  }

  const refreshed = await prisma.externalContainerMapping.findUnique({
    where: { id: updated.id },
    include: {
      area: true,
      folder: true,
      table: true
    }
  });

  res.json({ data: refreshed });
}));

operatingModelRouter.get("/external-fields", asyncHandler(async (req, res) => {
  const fields = await prisma.externalFieldMapping.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: [{ provider: "asc" }, { name: "asc" }],
    include: { table: true }
  });

  res.json({ data: fields });
}));

operatingModelRouter.get("/storage-locations", asyncHandler(async (req, res) => {
  const locations = await prisma.storageLocation.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { name: "asc" }
  });

  res.json({ data: locations });
}));

operatingModelRouter.get("/storage-locations/:id", asyncHandler(async (req, res) => {
  const location = await prisma.storageLocation.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!location) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: location });
}));

operatingModelRouter.post("/storage-locations", asyncHandler(async (req, res) => {
  const input = storageLocationSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  if (!(await assertScope(workspaceId, input))) {
    return res.status(404).json({ error: "not_found" });
  }

  const location = await prisma.storageLocation.create({
    data: {
      workspaceId,
      areaId: input.areaId,
      folderId: input.folderId,
      tableId: input.tableId,
      provider: input.provider,
      name: input.name,
      locator: input.locator as Prisma.InputJsonValue
    }
  });

  res.status(201).json({ data: location });
}));

operatingModelRouter.patch("/storage-locations/:id", asyncHandler(async (req, res) => {
  const input = updateStorageLocationSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  if (!(await assertScope(workspaceId, input))) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.storageLocation.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const location = await prisma.storageLocation.update({
    where: { id: existing.id },
    data: {
      ...input,
      locator: input.locator as Prisma.InputJsonValue | undefined
    }
  });

  res.json({ data: location });
}));

operatingModelRouter.delete("/storage-locations/:id", asyncHandler(async (req, res) => {
  const workspaceId = req.auth!.workspaceId;
  const existing = await prisma.storageLocation.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  await prisma.storageLocation.delete({ where: { id: existing.id } });
  res.json({ data: { id: existing.id, deleted: true } });
}));

operatingModelRouter.get("/knowledge-roots", asyncHandler(async (req, res) => {
  const roots = await prisma.knowledgeRoot.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { name: "asc" }
  });

  res.json({ data: roots });
}));

operatingModelRouter.get("/knowledge-roots/:id", asyncHandler(async (req, res) => {
  const root = await prisma.knowledgeRoot.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!root) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: root });
}));

operatingModelRouter.post("/knowledge-roots", asyncHandler(async (req, res) => {
  const input = knowledgeRootSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  if (!(await assertScope(workspaceId, input))) {
    return res.status(404).json({ error: "not_found" });
  }

  const root = await prisma.knowledgeRoot.create({
    data: {
      workspaceId,
      areaId: input.areaId,
      folderId: input.folderId,
      tableId: input.tableId,
      provider: input.provider,
      name: input.name,
      locator: input.locator as Prisma.InputJsonValue
    }
  });

  res.status(201).json({ data: root });
}));

operatingModelRouter.patch("/knowledge-roots/:id", asyncHandler(async (req, res) => {
  const input = updateKnowledgeRootSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  if (!(await assertScope(workspaceId, input))) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.knowledgeRoot.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const root = await prisma.knowledgeRoot.update({
    where: { id: existing.id },
    data: {
      ...input,
      locator: input.locator as Prisma.InputJsonValue | undefined
    }
  });

  res.json({ data: root });
}));

operatingModelRouter.delete("/knowledge-roots/:id", asyncHandler(async (req, res) => {
  const workspaceId = req.auth!.workspaceId;
  const existing = await prisma.knowledgeRoot.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  await prisma.knowledgeRoot.delete({ where: { id: existing.id } });
  res.json({ data: { id: existing.id, deleted: true } });
}));

operatingModelRouter.get("/automation-definitions", asyncHandler(async (req, res) => {
  const automations = await prisma.automationDefinition.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { name: "asc" }
  });

  res.json({ data: automations });
}));

operatingModelRouter.get("/automation-definitions/:id", asyncHandler(async (req, res) => {
  const automation = await prisma.automationDefinition.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!automation) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: automation });
}));

operatingModelRouter.post("/automation-definitions", asyncHandler(async (req, res) => {
  const input = automationDefinitionSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  if (!(await assertScope(workspaceId, input))) {
    return res.status(404).json({ error: "not_found" });
  }

  const automation = await prisma.automationDefinition.create({
    data: {
      workspaceId,
      areaId: input.areaId,
      folderId: input.folderId,
      tableId: input.tableId,
      provider: input.provider,
      triggerType: input.triggerType,
      name: input.name,
      enabled: input.enabled ?? true,
      config: (input.config ?? {}) as Prisma.InputJsonValue
    }
  });

  res.status(201).json({ data: automation });
}));

operatingModelRouter.patch("/automation-definitions/:id", asyncHandler(async (req, res) => {
  const input = updateAutomationDefinitionSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  if (!(await assertScope(workspaceId, input))) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.automationDefinition.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const automation = await prisma.automationDefinition.update({
    where: { id: existing.id },
    data: {
      ...input,
      config: input.config as Prisma.InputJsonValue | undefined
    }
  });

  res.json({ data: automation });
}));

operatingModelRouter.delete("/automation-definitions/:id", asyncHandler(async (req, res) => {
  const workspaceId = req.auth!.workspaceId;
  const existing = await prisma.automationDefinition.findFirst({
    where: { id: String(req.params.id), workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  await prisma.automationDefinition.delete({ where: { id: existing.id } });
  res.json({ data: { id: existing.id, deleted: true } });
}));
