import { IntegrationError } from "../errors";

const clickUpBaseUrl = "https://api.clickup.com/api/v2";

export type ClickUpTask = {
  id: string;
  name: string;
  description?: string | null;
  markdown_description?: string | null;
  text_content?: string | null;
  status?: {
    status?: string | null;
    type?: string | null;
  } | null;
  priority?: {
    priority?: string | null;
  } | null;
  due_date?: string | null;
  list?: {
    id?: string | null;
  } | null;
};

type ClickUpTasksResponse = {
  tasks?: ClickUpTask[];
  last_page?: boolean;
};

export class ClickUpClient {
  constructor(private readonly token: string) {}

  async getWorkspaceTasks(input: {
    teamId: string;
    listIds: string[];
    includeClosed?: boolean;
    maxPages?: number;
  }) {
    const maxPages = input.maxPages ?? 10;
    const tasks: ClickUpTask[] = [];

    for (let page = 0; page < maxPages; page += 1) {
      const url = new URL(`${clickUpBaseUrl}/team/${input.teamId}/task`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("include_closed", String(input.includeClosed ?? true));
      url.searchParams.set("subtasks", "true");
      url.searchParams.set("include_markdown_description", "true");
      for (const listId of input.listIds) {
        url.searchParams.append("list_ids[]", listId);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: this.token,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new IntegrationError(
          "integration_unavailable",
          502,
          `ClickUp request failed with status ${response.status}.`
        );
      }

      const payload = await response.json() as ClickUpTasksResponse;
      const pageTasks = payload.tasks ?? [];
      tasks.push(...pageTasks);

      if (payload.last_page || pageTasks.length === 0) {
        break;
      }
    }

    return tasks;
  }
}
