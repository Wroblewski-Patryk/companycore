import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createTargetSchema = z.object({
  goalId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  metric: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.string().optional(),
  externalId: z.string().optional(),
  source: z.string().optional()
});

const updateTargetSchema = createTargetSchema.partial().omit({
  externalId: true,
  source: true
});

export const targetsRouter = Router();

async function goalIsVisible(workspaceId: string, goalId?: string) {
  if (!goalId) {
    return true;
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, workspaceId }
  });

  return Boolean(goal);
}

targetsRouter.get("/", asyncHandler(async (req, res) => {
  const targets = await prisma.target.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: targets });
}));

targetsRouter.get("/:id", asyncHandler(async (req, res) => {
  const target = await prisma.target.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!target) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: target });
}));

targetsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createTargetSchema.parse(req.body);
  if (!await goalIsVisible(req.auth!.workspaceId, input.goalId)) {
    return res.status(404).json({ error: "not_found" });
  }

  const target = await prisma.target.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });
  await createEvent({
    type: "target_created",
    workspaceId: req.auth!.workspaceId,
    source: target.source,
    payload: { targetId: target.id, title: target.title, goalId: target.goalId }
  });
  res.status(201).json({ data: target });
}));

targetsRouter.patch("/:id", asyncHandler(async (req, res) => {
  const input = updateTargetSchema.parse(req.body);
  if (!await goalIsVisible(req.auth!.workspaceId, input.goalId)) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.target.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const target = await prisma.target.update({
    where: { id: existing.id },
    data: input
  });

  await createEvent({
    type: "target_updated",
    workspaceId: req.auth!.workspaceId,
    source: target.source,
    payload: { targetId: target.id, changed: Object.keys(input) }
  });

  res.json({ data: target });
}));

targetsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.target.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const target = await prisma.target.update({
    where: { id: existing.id },
    data: { status: "archived" }
  });

  await createEvent({
    type: "target_archived",
    workspaceId: req.auth!.workspaceId,
    source: target.source,
    payload: { targetId: target.id, goalId: target.goalId }
  });

  res.json({ data: target });
}));
