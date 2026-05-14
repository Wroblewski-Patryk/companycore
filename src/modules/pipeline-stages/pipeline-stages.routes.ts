import { Router } from "express";
import { OperatingStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createPipelineStageSchema = z.object({
  name: z.string().min(1),
  position: z.coerce.number().int().optional(),
  status: z.nativeEnum(OperatingStatus).optional(),
  externalId: z.string().min(1).optional(),
  source: z.string().min(1).optional()
}).strict();

const updatePipelineStageSchema = createPipelineStageSchema.partial().omit({
  externalId: true,
  source: true
});

export const pipelineStagesRouter = Router();

pipelineStagesRouter.get("/", asyncHandler(async (req, res) => {
  const stages = await prisma.pipelineStage.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: [
      { position: "asc" },
      { createdAt: "asc" }
    ]
  });

  res.json({ data: stages });
}));

pipelineStagesRouter.get("/:id", asyncHandler(async (req, res) => {
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!stage) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: stage });
}));

pipelineStagesRouter.post("/", asyncHandler(async (req, res) => {
  const input = createPipelineStageSchema.parse(req.body);
  const stage = await prisma.pipelineStage.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });

  await createEvent({
    type: "pipeline_stage_created",
    workspaceId: req.auth!.workspaceId,
    source: stage.source,
    payload: {
      pipelineStageId: stage.id,
      name: stage.name,
      position: stage.position
    }
  });

  res.status(201).json({ data: stage });
}));

pipelineStagesRouter.patch("/:id", asyncHandler(async (req, res) => {
  const input = updatePipelineStageSchema.parse(req.body);
  const existing = await prisma.pipelineStage.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const stage = await prisma.pipelineStage.update({
    where: { id: existing.id },
    data: input
  });

  await createEvent({
    type: "pipeline_stage_updated",
    workspaceId: req.auth!.workspaceId,
    source: stage.source,
    payload: {
      pipelineStageId: stage.id,
      changed: Object.keys(input)
    }
  });

  res.json({ data: stage });
}));

pipelineStagesRouter.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.pipelineStage.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const stage = await prisma.pipelineStage.update({
    where: { id: existing.id },
    data: { status: "archived" }
  });

  await createEvent({
    type: "pipeline_stage_archived",
    workspaceId: req.auth!.workspaceId,
    source: stage.source,
    payload: { pipelineStageId: stage.id }
  });

  res.json({ data: stage });
}));
