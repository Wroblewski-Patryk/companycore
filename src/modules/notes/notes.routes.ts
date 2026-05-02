import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createNoteSchema = z.object({
  content: z.string().min(1),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  externalId: z.string().optional(),
  source: z.string().optional()
});

export const notesRouter = Router();

notesRouter.get("/", asyncHandler(async (req, res) => {
  const notes = await prisma.note.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: notes });
}));

notesRouter.post("/", asyncHandler(async (req, res) => {
  const input = createNoteSchema.parse(req.body);
  const workspaceId = req.auth!.workspaceId;

  const relationChecks = [
    input.projectId ? prisma.project.findFirst({ where: { id: input.projectId, workspaceId } }) : null,
    input.taskId ? prisma.task.findFirst({ where: { id: input.taskId, workspaceId } }) : null,
    input.clientId ? prisma.client.findFirst({ where: { id: input.clientId, workspaceId } }) : null,
    input.dealId ? prisma.deal.findFirst({ where: { id: input.dealId, workspaceId } }) : null
  ].filter(Boolean);

  const relations = await Promise.all(relationChecks);
  if (relations.some((relation) => !relation)) {
    return res.status(404).json({ error: "not_found" });
  }

  const note = await prisma.note.create({
    data: {
      ...input,
      workspaceId
    }
  });
  await createEvent({
    type: "note_created",
    workspaceId,
    source: note.source,
    projectId: note.projectId,
    taskId: note.taskId,
    payload: {
      noteId: note.id,
      projectId: note.projectId,
      taskId: note.taskId,
      clientId: note.clientId,
      dealId: note.dealId
    }
  });
  res.status(201).json({ data: note });
}));
