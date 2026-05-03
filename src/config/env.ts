import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  publicApiBaseUrl: process.env.COMPANYCORE_PUBLIC_API_BASE_URL,
  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? (process.env.NODE_ENV === "production" ? undefined : "dev-google-oauth-client-id"),
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : "dev-google-oauth-client-secret"),
  buildCommit: process.env.COMPANYCORE_BUILD_COMMIT
    ?? process.env.SOURCE_COMMIT
    ?? process.env.COOLIFY_GIT_COMMIT_SHA
    ?? process.env.GIT_COMMIT
    ?? "unknown",
  buildImage: process.env.COMPANYCORE_BUILD_IMAGE ?? "unknown",
  clickUpMaintenanceIntervalMinutes: Number(process.env.CLICKUP_MAINTENANCE_INTERVAL_MINUTES ?? 15),
  authTokenSecret: process.env.AUTH_TOKEN_SECRET ?? "dev-companycore-auth-secret-change-me",
  integrationSecretKey: process.env.INTEGRATION_SECRET_KEY ?? "dev-companycore-integration-secret-change-me",
  apiKeyHashSecret: process.env.API_KEY_HASH_SECRET ?? process.env.AUTH_TOKEN_SECRET ?? "dev-companycore-auth-secret-change-me"
};
