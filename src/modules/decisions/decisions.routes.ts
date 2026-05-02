import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createDecisionSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1),
  rationale: z.string().optional(),
  outcome: z.string().optional(),
  externalId: z.string().optional(),
  source: z.string().optional()
});

export const decisionsRouter = Router();

decisionsRouter.get("/", asyncHandler(async (req, res) => {
  const decisions = await prisma.decision.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: decisions });
}));

decisionsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createDecisionSchema.parse(req.body);
  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, workspaceId: req.auth!.workspaceId }
    });
    if (!project) {
      return res.status(404).json({ error: "not_found" });
    }
  }

  const decision = await prisma.decision.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });

  await createEvent({
    type: "decision_created",
    workspaceId: req.auth!.workspaceId,
    source: decision.source,
    projectId: decision.projectId,
    payload: {
      decisionId: decision.id,
      projectId: decision.projectId,
      title: decision.title,
      workspaceId: req.auth!.workspaceId
    }
  });

  res.status(201).json({ data: decision });
}));
