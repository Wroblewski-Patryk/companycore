import { createHmac } from "crypto";
import { env } from "../config/env";

export function hashApiKey(apiKey: string) {
  return createHmac("sha256", env.apiKeyHashSecret).update(apiKey).digest("hex");
}

export function apiKeyPrefix(apiKey: string) {
  return apiKey.slice(0, 10);
}
