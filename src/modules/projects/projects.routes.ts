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

export const projectsRouter = Router();

projectsRouter.get("/", asyncHandler(async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: projects });
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
