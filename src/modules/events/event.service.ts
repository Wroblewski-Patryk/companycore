import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";

type CreateEventInput = {
  type: string;
  workspaceId?: string | null;
  source?: string | null;
  actorType?: "user" | "agent" | "system" | "integration" | null;
  actorId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  correlationId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  payload?: Prisma.InputJsonValue;
};

export async function createEvent(input: CreateEventInput) {
  return prisma.event.create({
    data: {
      type: input.type,
      workspaceId: input.workspaceId,
      source: input.source ?? "companycore",
      actorType: input.actorType,
      actorId: input.actorId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      correlationId: input.correlationId,
      projectId: input.projectId,
      taskId: input.taskId,
      payload: input.payload
    }
  });
}
