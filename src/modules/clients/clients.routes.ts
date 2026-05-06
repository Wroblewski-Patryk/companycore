import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { createEvent } from "../events/event.service";

const createClientSchema = z.object({
  name: z.string().min(1),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  externalId: z.string().optional(),
  source: z.string().optional()
});

const updateClientSchema = createClientSchema.partial().omit({
  externalId: true,
  source: true
});

export const clientsRouter = Router();

clientsRouter.get("/", asyncHandler(async (req, res) => {
  const clients = await prisma.client.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: clients });
}));

clientsRouter.get("/:id", asyncHandler(async (req, res) => {
  const client = await prisma.client.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!client) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({ data: client });
}));

clientsRouter.post("/", asyncHandler(async (req, res) => {
  const input = createClientSchema.parse(req.body);
  const client = await prisma.client.create({
    data: {
      ...input,
      workspaceId: req.auth!.workspaceId
    }
  });
  await createEvent({
    type: "client_created",
    workspaceId: req.auth!.workspaceId,
    source: client.source,
    payload: {
      clientId: client.id,
      name: client.name,
      companyName: client.companyName
    }
  });
  res.status(201).json({ data: client });
}));

clientsRouter.patch("/:id", asyncHandler(async (req, res) => {
  const input = updateClientSchema.parse(req.body);
  const existing = await prisma.client.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const client = await prisma.client.update({
    where: { id: existing.id },
    data: input
  });

  await createEvent({
    type: "client_updated",
    workspaceId: req.auth!.workspaceId,
    source: client.source,
    payload: { clientId: client.id, changed: Object.keys(input) }
  });

  res.json({ data: client });
}));

clientsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.client.findFirst({
    where: { id: String(req.params.id), workspaceId: req.auth!.workspaceId }
  });

  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const client = await prisma.client.update({
    where: { id: existing.id },
    data: { status: "archived" }
  });

  await createEvent({
    type: "client_archived",
    workspaceId: req.auth!.workspaceId,
    source: client.source,
    payload: { clientId: client.id }
  });

  res.json({ data: client });
}));
