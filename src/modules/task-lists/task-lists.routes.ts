import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createTaskListSchema = z.object({
  projectId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().min(1).optional(),
  externalId: z.string().min(1).optional(),
  source: z.string().min(1).optional()
}).strict();

const updateTaskListSchema = createTaskListSchema.partial().omit({
  externalId: true,
  source: true
});

export const taskListsRouter = Router();

async function projectIsVisible(workspaceId: string, projectId?: string) {
  if (!projectId) {
    return true;
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId }
  });

  return Boolean(project);
}

taskListsRouter.get("/", asyncHandler(async (req, res) => {
  const taskLists = await prisma.taskList.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: taskLists });
}));

taskListsRouter.get("/:id", asyncHandler(async (req, res) => {
  const taskList = await prisma.taskList.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!taskList) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: taskList });
}));

taskListsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createTaskListSchema.parse(req.body);

  if (!await projectIsVisible(req.auth!.workspaceId, input.projectId)) {
    return res.status(404).json({ error: "not_found" });
  }

  const taskList = await prisma.taskList.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });

  await createEvent({
    type: "task_list_created",
    workspaceId: req.auth!.workspaceId,
    projectId: taskList.projectId,
    source: taskList.source,
    payload: {
      taskListId: taskList.id,
      projectId: taskList.projectId,
      name: taskList.name
    }
  });

  res.status(201).json({ data: taskList });
}));

taskListsRouter.patch("/:id", asyncHandler(async (req, res) => {
  const input = updateTaskListSchema.parse(req.body);

  if (!await projectIsVisible(req.auth!.workspaceId, input.projectId)) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.taskList.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const taskList = await prisma.taskList.update({
    where: { id: existing.id },
    data: input
  });

  await createEvent({
    type: "task_list_updated",
    workspaceId: req.auth!.workspaceId,
    projectId: taskList.projectId,
    source: taskList.source,
    payload: {
      taskListId: taskList.id,
      changed: Object.keys(input)
    }
  });

  res.json({ data: taskList });
}));

taskListsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.taskList.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const taskList = await prisma.taskList.update({
    where: { id: existing.id },
    data: { status: "archived" }
  });

  await createEvent({
    type: "task_list_archived",
    workspaceId: req.auth!.workspaceId,
    projectId: taskList.projectId,
    source: taskList.source,
    payload: { taskListId: taskList.id }
  });

  res.json({ data: taskList });
}));
