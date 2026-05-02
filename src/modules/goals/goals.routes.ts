import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createGoalSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  externalId: z.string().optional(),
  source: z.string().optional()
});

export const goalsRouter = Router();

goalsRouter.get("/", asyncHandler(async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: goals });
}));

goalsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createGoalSchema.parse(req.body);
  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, workspaceId: req.auth!.workspaceId }
    });
    if (!project) {
      return res.status(404).json({ error: "not_found" });
    }
  }

  const goal = await prisma.goal.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });
  await createEvent({
    type: "goal_created",
    workspaceId: req.auth!.workspaceId,
    projectId: goal.projectId,
    source: goal.source,
    payload: { goalId: goal.id, title: goal.title }
  });
  res.status(201).json({ data: goal });
}));
