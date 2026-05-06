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
  status: z.string().min(1).optional(),
  externalId: z.string().optional(),
  source: z.string().optional()
});

const updateDecisionSchema = createDecisionSchema.partial().omit({
  externalId: true,
  source: true
});

export const decisionsRouter = Router();

async function projectIsVisible(workspaceId: string, projectId?: string) {
  if (!projectId) {
    return true;
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId }
  });

  return Boolean(project);
}

decisionsRouter.get("/", asyncHandler(async (req, res) => {
  const decisions = await prisma.decision.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: decisions });
}));

decisionsRouter.get("/:id", asyncHandler(async (req, res) => {
  const decision = await prisma.decision.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!decision) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: decision });
}));

decisionsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createDecisionSchema.parse(req.body);
  if (!await projectIsVisible(req.auth!.workspaceId, input.projectId)) {
    return res.status(404).json({ error: "not_found" });
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

decisionsRouter.patch("/:id", asyncHandler(async (req, res) => {
  const input = updateDecisionSchema.parse(req.body);
  if (!await projectIsVisible(req.auth!.workspaceId, input.projectId)) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.decision.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const decision = await prisma.decision.update({
    where: { id: existing.id },
    data: input
  });

  await createEvent({
    type: "decision_updated",
    workspaceId: req.auth!.workspaceId,
    source: decision.source,
    projectId: decision.projectId,
    payload: { decisionId: decision.id, changed: Object.keys(input) }
  });

  res.json({ data: decision });
}));

decisionsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.decision.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const decision = await prisma.decision.update({
    where: { id: existing.id },
    data: { status: "archived" }
  });

  await createEvent({
    type: "decision_archived",
    workspaceId: req.auth!.workspaceId,
    source: decision.source,
    projectId: decision.projectId,
    payload: { decisionId: decision.id }
  });

  res.json({ data: decision });
}));
