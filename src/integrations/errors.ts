export class IntegrationError extends Error {
  constructor(
    public readonly code: "integration_not_configured" | "integration_unavailable" | "sync_failed",
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}
