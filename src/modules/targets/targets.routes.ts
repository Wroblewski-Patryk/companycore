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

export const targetsRouter = Router();

targetsRouter.get("/", asyncHandler(async (req, res) => {
  const targets = await prisma.target.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: targets });
}));

targetsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createTargetSchema.parse(req.body);
  if (input.goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: input.goalId, workspaceId: req.auth!.workspaceId }
    });
    if (!goal) {
      return res.status(404).json({ error: "not_found" });
    }
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
