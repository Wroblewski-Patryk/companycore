import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  externalId: z.string().optional(),
  source: z.string().optional()
});

const updateProjectSchema = createProjectSchema.partial().omit({
  externalId: true,
  source: true
});

export const projectsRouter = Router();

projectsRouter.get("/", asyncHandler(async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: projects });
}));

projectsRouter.get("/:id", asyncHandler(async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!project) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: project });
}));

projectsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createProjectSchema.parse(req.body);
  const project = await prisma.project.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });
  await createEvent({
    type: "project_created",
    workspaceId: req.auth!.workspaceId,
    projectId: project.id,
    source: project.source,
    payload: { projectId: project.id, name: project.name }
  });
  res.status(201).json({ data: project });
}));

projectsRouter.patch("/:id", asyncHandler(async (req, res) => {
  const input = updateProjectSchema.parse(req.body);
  const existing = await prisma.project.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: input
  });

  await createEvent({
    type: "project_updated",
    workspaceId: req.auth!.workspaceId,
    projectId: project.id,
    source: project.source,
    payload: { projectId: project.id, changed: Object.keys(input) }
  });

  res.json({ data: project });
}));

projectsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.project.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: { status: "archived" }
  });

  await createEvent({
    type: "project_archived",
    workspaceId: req.auth!.workspaceId,
    projectId: project.id,
    source: project.source,
    payload: { projectId: project.id }
  });

  res.json({ data: project });
}));
