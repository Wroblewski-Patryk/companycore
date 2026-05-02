import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma";
import { createEvent } from "../../modules/events/event.service";
import { IntegrationError } from "../errors";
import { getClickUpSettingsForWorkspace } from "../integration-settings.service";
import { ClickUpClient } from "./clickup.client";
import { mapClickUpTaskToCompanyCoreTask, safeClickUpTaskPayload } from "./clickup.mapper";

type SyncResult = {
  provider: "clickup";
  workspaceId: string;
  itemCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
};

export async function syncClickUpTasksForWorkspace(workspaceId: string): Promise<SyncResult> {
  const correlationId = randomUUID();
  const settings = await getClickUpSettingsForWorkspace(workspaceId);

  if (!settings) {
    throw new IntegrationError(
      "integration_not_configured",
      422,
      "ClickUp integration is not configured for this workspace."
    );
  }

  const listIds = settings.config.listIds ?? [];
  const teamId = settings.config.teamId;

  if (!teamId || listIds.length === 0) {
    throw new IntegrationError(
      "integration_not_configured",
      422,
      "ClickUp teamId and at least one listId are required before sync."
    );
  }

  await createEvent({
    type: "sync_started",
    workspaceId,
    source: "clickup",
    payload: {
      provider: "clickup",
      workspaceId,
      correlationId,
      operation: "sync_tasks",
      listCount: listIds.length
    }
  });

  try {
    const client = new ClickUpClient(settings.token);
    const clickUpTasks = await client.getWorkspaceTasks({ teamId, listIds });
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const clickUpTask of clickUpTasks) {
      if (!clickUpTask.id || !clickUpTask.name) {
        skippedCount += 1;
        continue;
      }

      const data = mapClickUpTaskToCompanyCoreTask(clickUpTask, workspaceId);
      const existing = await prisma.task.findUnique({
        where: {
          workspaceId_source_externalId: {
            workspaceId,
            source: "clickup",
            externalId: clickUpTask.id
          }
        }
      });

      const task = await prisma.task.upsert({
        where: {
          workspaceId_source_externalId: {
            workspaceId,
            source: "clickup",
            externalId: clickUpTask.id
          }
        },
        update: data,
        create: data
      });

      if (existing) {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }

      await createEvent({
        type: "task_synced_from_clickup",
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        source: "clickup",
        payload: {
          provider: "clickup",
          workspaceId,
          correlationId,
          taskId: task.id,
          externalId: clickUpTask.id,
          raw: safeClickUpTaskPayload(clickUpTask)
        }
      });
    }

    await createEvent({
      type: "sync_succeeded",
      workspaceId,
      source: "clickup",
      payload: {
        provider: "clickup",
        workspaceId,
        correlationId,
        operation: "sync_tasks",
        itemCount: clickUpTasks.length,
        createdCount,
        updatedCount,
        skippedCount
      }
    });

    return {
      provider: "clickup",
      workspaceId,
      itemCount: clickUpTasks.length,
      createdCount,
      updatedCount,
      skippedCount
    };
  } catch (error) {
    const code = error instanceof IntegrationError ? error.code : "sync_failed";

    await createEvent({
      type: "sync_failed",
      workspaceId,
      source: "clickup",
      payload: {
        provider: "clickup",
        workspaceId,
        correlationId,
        operation: "sync_tasks",
        errorCode: code
      }
    });

    throw error;
  }
}
