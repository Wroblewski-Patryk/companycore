#!/usr/bin/env node

import { spawn } from "node:child_process";

const baseUrl = (process.env.COMPANYCORE_BASE_URL ?? "").trim();
const apiKey = (process.env.COMPANYCORE_API_KEY ?? "").trim();
const allowRegistration = process.env.COMPANYCORE_DEPLOY_SMOKE_ALLOW_REGISTRATION === "true";

function fail(message) {
  process.stderr.write(`[aog-deploy-smoke] ${message}\n`);
  process.exit(1);
}

function run(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      shell: process.platform === "win32",
      stdio: "inherit"
    });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

if (!baseUrl) {
  fail("COMPANYCORE_BASE_URL is required.");
}

if (!apiKey) {
  fail("COMPANYCORE_API_KEY is required.");
}

const smokeEnv = {
  COMPANYCORE_BASE_URL: baseUrl,
  COMPANYCORE_API_KEY: apiKey
};

const mcpCode = await run("npm", ["run", "mcp:smoke"], smokeEnv);
if (mcpCode !== 0) {
  fail("MCP smoke failed.");
}

if (allowRegistration) {
  const aiReadyCode = await run("npm", ["run", "ai-ready:smoke"], {
    COMPANYCORE_BASE_URL: baseUrl
  });
  if (aiReadyCode !== 0) {
    fail("AI-ready smoke failed.");
  }
} else {
  process.stdout.write("[aog-deploy-smoke] Skipping ai-ready:smoke (set COMPANYCORE_DEPLOY_SMOKE_ALLOW_REGISTRATION=true to enable).\n");
}

process.stdout.write("[aog-deploy-smoke] OK\n");
