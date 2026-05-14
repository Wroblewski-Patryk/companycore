import "dotenv/config";

const productionCorsFallbackOrigins = [
  "https://companycore.luckysparrow.ch",
  "https://api.companycore.luckysparrow.ch"
];

function splitCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireProductionValue(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (process.env.NODE_ENV === "production" && !value) {
    throw new Error(`Missing required production environment variable: ${name}`);
  }
  return value;
}

function requireProductionSecret(name: string, fallback?: string): string {
  const value = requireProductionValue(name, fallback);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (
    process.env.NODE_ENV === "production"
    && value
    && (value.startsWith("dev-companycore-") || value.includes("change-me"))
  ) {
    throw new Error(`Unsafe production environment variable value: ${name}`);
  }
  return value;
}

function getCorsAllowedOrigins() {
  if (process.env.NODE_ENV !== "production") {
    return splitCsv(process.env.COMPANYCORE_ALLOWED_ORIGINS);
  }

  const configuredOrigins = splitCsv(process.env.COMPANYCORE_ALLOWED_ORIGINS);
  return configuredOrigins.length > 0
    ? configuredOrigins
    : productionCorsFallbackOrigins;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requireProductionValue("DATABASE_URL"),
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
  authTokenSecret: requireProductionSecret(
    "AUTH_TOKEN_SECRET",
    process.env.NODE_ENV === "production" ? undefined : "dev-companycore-auth-secret-change-me"
  ),
  integrationSecretKey: requireProductionSecret(
    "INTEGRATION_SECRET_KEY",
    process.env.NODE_ENV === "production" ? undefined : "dev-companycore-integration-secret-change-me"
  ),
  apiKeyHashSecret: requireProductionSecret(
    "API_KEY_HASH_SECRET",
    process.env.NODE_ENV === "production"
      ? undefined
      : process.env.AUTH_TOKEN_SECRET ?? "dev-companycore-auth-secret-change-me"
  ),
  corsAllowedOrigins: getCorsAllowedOrigins()
};
