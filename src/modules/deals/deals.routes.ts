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

const updateDealSchema = createDealSchema.partial().omit({
  externalId: true,
  source: true
});

export const dealsRouter = Router();

async function dealRelationsAreVisible(workspaceId: string, input: {
  clientId?: string;
  pipelineStageId?: string;
}) {
  const checks = [
    input.clientId ? prisma.client.findFirst({ where: { id: input.clientId, workspaceId } }) : null,
    input.pipelineStageId ? prisma.pipelineStage.findFirst({ where: { id: input.pipelineStageId, workspaceId } }) : null
  ].filter(Boolean);

  const relations = await Promise.all(checks);
  return relations.every((relation) => Boolean(relation));
}

dealsRouter.get("/", asyncHandler(async (req, res) => {
  const deals = await prisma.deal.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: deals });
}));

dealsRouter.get("/:id", asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!deal) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: deal });
}));

dealsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createDealSchema.parse(req.body);
  if (!await dealRelationsAreVisible(req.auth!.workspaceId, input)) {
    return res.status(404).json({ error: "not_found" });
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

dealsRouter.patch("/:id", asyncHandler(async (req, res) => {
  const input = updateDealSchema.parse(req.body);
  if (!await dealRelationsAreVisible(req.auth!.workspaceId, input)) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.deal.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const deal = await prisma.deal.update({
    where: { id: existing.id },
    data: input
  });

  await createEvent({
    type: "deal_updated",
    workspaceId: req.auth!.workspaceId,
    source: deal.source,
    payload: { dealId: deal.id, changed: Object.keys(input) }
  });

  res.json({ data: deal });
}));

dealsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.deal.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const deal = await prisma.deal.update({
    where: { id: existing.id },
    data: { status: "archived" }
  });

  await createEvent({
    type: "deal_archived",
    workspaceId: req.auth!.workspaceId,
    source: deal.source,
    payload: { dealId: deal.id, clientId: deal.clientId }
  });

  res.json({ data: deal });
}));
