import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createInteractionSchema = z.object({
  clientId: z.string().uuid().optional(),
  type: z.string().min(1),
  summary: z.string().optional(),
  status: z.string().min(1).optional(),
  occurredAt: z.coerce.date().optional(),
  externalId: z.string().min(1).optional(),
  source: z.string().min(1).optional()
}).strict();

const updateInteractionSchema = createInteractionSchema.partial().omit({
  externalId: true,
  source: true
});

export const interactionsRouter = Router();

async function clientIsVisible(workspaceId: string, clientId?: string) {
  if (!clientId) {
    return true;
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId }
  });

  return Boolean(client);
}

interactionsRouter.get("/", asyncHandler(async (req, res) => {
  const interactions = await prisma.interaction.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { occurredAt: "desc" }
  });

  res.json({ data: interactions });
}));

interactionsRouter.get("/:id", asyncHandler(async (req, res) => {
  const interaction = await prisma.interaction.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!interaction) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: interaction });
}));

interactionsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createInteractionSchema.parse(req.body);

  if (!await clientIsVisible(req.auth!.workspaceId, input.clientId)) {
    return res.status(404).json({ error: "not_found" });
  }

  const interaction = await prisma.interaction.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });

  await createEvent({
    type: "interaction_created",
    workspaceId: req.auth!.workspaceId,
    source: interaction.source,
    payload: {
      interactionId: interaction.id,
      clientId: interaction.clientId,
      type: interaction.type,
      occurredAt: interaction.occurredAt
    }
  });

  res.status(201).json({ data: interaction });
}));

interactionsRouter.patch("/:id", asyncHandler(async (req, res) => {
  const input = updateInteractionSchema.parse(req.body);

  if (!await clientIsVisible(req.auth!.workspaceId, input.clientId)) {
    return res.status(404).json({ error: "not_found" });
  }

  const existing = await prisma.interaction.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const interaction = await prisma.interaction.update({
    where: { id: existing.id },
    data: input
  });

  await createEvent({
    type: "interaction_updated",
    workspaceId: req.auth!.workspaceId,
    source: interaction.source,
    payload: {
      interactionId: interaction.id,
      clientId: interaction.clientId,
      changed: Object.keys(input)
    }
  });

  res.json({ data: interaction });
}));

interactionsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.interaction.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const interaction = await prisma.interaction.update({
    where: { id: existing.id },
    data: { status: "archived" }
  });

  await createEvent({
    type: "interaction_archived",
    workspaceId: req.auth!.workspaceId,
    source: interaction.source,
    payload: { interactionId: interaction.id, clientId: interaction.clientId }
  });

  res.json({ data: interaction });
}));
