import { DealStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createDealSchema = z.object({
  clientId: z.string().uuid().optional(),
  pipelineStageId: z.string().uuid().optional(),
  title: z.string().min(1),
  value: z.coerce.number().optional(),
  currency: z.string().optional(),
  status: z.nativeEnum(DealStatus).optional(),
  externalId: z.string().optional(),
  source: z.string().optional()
});

export const dealsRouter = Router();

dealsRouter.get("/", asyncHandler(async (req, res) => {
  const deals = await prisma.deal.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: deals });
}));

dealsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createDealSchema.parse(req.body);
  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, workspaceId: req.auth!.workspaceId }
    });
    if (!client) {
      return res.status(404).json({ error: "not_found" });
    }
  }

  if (input.pipelineStageId) {
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: input.pipelineStageId, workspaceId: req.auth!.workspaceId }
    });
    if (!stage) {
      return res.status(404).json({ error: "not_found" });
    }
  }

  const deal = await prisma.deal.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });
  await createEvent({
    type: "deal_created",
    workspaceId: req.auth!.workspaceId,
    source: deal.source,
    payload: {
      dealId: deal.id,
      clientId: deal.clientId,
      title: deal.title,
      value: deal.value,
      currency: deal.currency
    }
  });
  res.status(201).json({ data: deal });
}));
