import { randomUUID } from "crypto";
import { IntegrationError } from "../errors";

const driveApiBaseUrl = "https://www.googleapis.com/drive/v3";
const driveUploadBaseUrl = "https://www.googleapis.com/upload/drive/v3";

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  parents?: string[];
  webViewLink?: string;
};

type GoogleDriveFileListResponse = {
  files?: GoogleDriveFile[];
  nextPageToken?: string;
};

type GoogleDriveStartPageTokenResponse = {
  startPageToken?: string;
};

type GoogleDriveChannelResponse = {
  id?: string;
  resourceId?: string;
  resourceUri?: string;
  expiration?: string;
};

export class GoogleDriveClient {
  constructor(private readonly token: string) {}

  async listTextFilesInFolder(folderId: string, includeGoogleDocs = true) {
    const files: GoogleDriveFile[] = [];
    let pageToken: string | undefined;
    const mimeTypes = [
      "mimeType = 'text/plain'",
      "mimeType = 'text/markdown'",
      includeGoogleDocs ? "mimeType = 'application/vnd.google-apps.document'" : ""
    ].filter(Boolean).join(" or ");

    do {
      const url = new URL(`${driveApiBaseUrl}/files`);
      url.searchParams.set("q", `'${folderId}' in parents and trashed = false and (${mimeTypes})`);
      url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,modifiedTime,parents,webViewLink)");
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("supportsAllDrives", "true");
      url.searchParams.set("includeItemsFromAllDrives", "true");
      if (pageToken) {
        url.searchParams.set("pageToken", pageToken);
      }

      const payload = await this.request<GoogleDriveFileListResponse>(url);
      files.push(...(payload.files ?? []).filter((file): file is GoogleDriveFile => Boolean(file.id && file.name)));
      pageToken = payload.nextPageToken;
    } while (pageToken);

    return files;
  }

  async downloadText(file: GoogleDriveFile) {
    if (file.mimeType === "application/vnd.google-apps.document") {
      const url = new URL(`${driveApiBaseUrl}/files/${encodeURIComponent(file.id)}/export`);
      url.searchParams.set("mimeType", "text/plain");
      return this.requestText(url);
    }

    const url = new URL(`${driveApiBaseUrl}/files/${encodeURIComponent(file.id)}`);
    url.searchParams.set("alt", "media");
    url.searchParams.set("supportsAllDrives", "true");
    return this.requestText(url);
  }

  async createTextFile(input: { folderId: string; name: string; content: string }) {
    const boundary = `companycore_${randomUUID()}`;
    const metadata = {
      name: input.name.endsWith(".txt") ? input.name : `${input.name}.txt`,
      mimeType: "text/plain",
      parents: [input.folderId]
    };

    const body = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(metadata),
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      input.content,
      `--${boundary}--`
    ].join("\r\n");

    const url = new URL(`${driveUploadBaseUrl}/files`);
    url.searchParams.set("uploadType", "multipart");
    url.searchParams.set("fields", "id,name,mimeType,modifiedTime,parents,webViewLink");
    url.searchParams.set("supportsAllDrives", "true");

    return this.request<GoogleDriveFile>(url, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body
    });
  }

  async updateTextFile(fileId: string, content: string) {
    const url = new URL(`${driveUploadBaseUrl}/files/${encodeURIComponent(fileId)}`);
    url.searchParams.set("uploadType", "media");
    url.searchParams.set("supportsAllDrives", "true");

    return this.request<GoogleDriveFile>(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      },
      body: content
    });
  }

  async getStartPageToken() {
    const payload = await this.request<GoogleDriveStartPageTokenResponse>("/changes/startPageToken");
    if (!payload.startPageToken) {
      throw new IntegrationError("integration_unavailable", 502, "Google Drive did not return a start page token.");
    }
    return payload.startPageToken;
  }

  async watchChanges(input: { pageToken: string; address: string; channelId: string; token: string }) {
    const payload = await this.request<GoogleDriveChannelResponse>(
      `/changes/watch?pageToken=${encodeURIComponent(input.pageToken)}`,
      {
        method: "POST",
        body: JSON.stringify({
          id: input.channelId,
          type: "web_hook",
          address: input.address,
          token: input.token
        })
      }
    );

    if (!payload.id || !payload.resourceId) {
      throw new IntegrationError("integration_unavailable", 502, "Google Drive did not return channel identifiers.");
    }

    return payload;
  }

  private async requestText(pathOrUrl: string | URL, init: RequestInit = {}) {
    const response = await fetch(this.url(pathOrUrl), {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(init.headers ?? {})
      }
    });
    await this.ensureOk(response);
    return response.text();
  }

  private async request<T>(pathOrUrl: string | URL, init: RequestInit = {}): Promise<T> {
    const response = await fetch(this.url(pathOrUrl), {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });

    await this.ensureOk(response);
    if (response.status === 204) {
      return {} as T;
    }
    return response.json() as Promise<T>;
  }

  private url(pathOrUrl: string | URL) {
    return pathOrUrl instanceof URL
      ? pathOrUrl
      : new URL(`${driveApiBaseUrl}${pathOrUrl}`);
  }

  private async ensureOk(response: Response) {
    if (response.ok) {
      return;
    }

    if (response.status === 401 || response.status === 403) {
      throw new IntegrationError("integration_invalid_token", 401, "Google Drive rejected the configured token.");
    }
    if (response.status === 404) {
      throw new IntegrationError("not_found", 404, "Google Drive resource was not found.");
    }
    if (response.status === 429) {
      throw new IntegrationError("integration_rate_limited", 429, "Google Drive rate limit was reached.");
    }

    throw new IntegrationError("integration_unavailable", 502, `Google Drive request failed with status ${response.status}.`);
  }
}
