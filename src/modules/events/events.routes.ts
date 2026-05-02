import { Router } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/async-handler";

export const eventsRouter = Router();

eventsRouter.get("/", asyncHandler(async (req, res) => {
  const events = await prisma.event.findMany({
    where: { workspaceId: req.auth!.workspaceId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: events });
}));
