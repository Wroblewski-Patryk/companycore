import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.COMPANYCORE_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
const ownerEmail = process.env.COMPANYCORE_OWNER_EMAIL || process.env.SEED_OWNER_EMAIL || "owner@example.com";
const ownerPassword = process.env.COMPANYCORE_OWNER_PASSWORD || process.env.SEED_OWNER_PASSWORD || "change-me-local-password";
const outputRoot = process.env.COMPANYCORE_UX_ARTIFACT_DIR
  || path.join(os.tmpdir(), "companycore-ux-smoke", new Date().toISOString().replace(/[:.]/g, "-"));

const routes = [
  "/dashboard",
  "/data",
  "/data/tasks",
  "/areas",
  "/relationships",
  "/settings/drive",
  "/settings/api"
];

const viewports = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 }
];

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = typeof body?.error === "string"
      ? body.error
      : body?.error?.code || body?.error?.message || response.statusText;
    throw new Error(`${options.method || "GET"} ${pathname} failed: ${response.status} ${error}`);
  }

  return body;
}

function slug(input) {
  return input.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root";
}

async function waitForConsoleHydration(page) {
  await page.waitForSelector("body.is-signed-in", { timeout: 10000 });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(450);
}

async function screenshot(page, fileName) {
  const filePath = path.join(outputRoot, fileName);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

async function main() {
  await mkdir(outputRoot, { recursive: true });

  const health = await request("/health");
  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: ownerEmail,
      password: ownerPassword
    })
  });
  const token = login.data?.token;
  if (!token) {
    throw new Error("Login response did not include an owner token.");
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    throw new Error(
      `Playwright Chromium could not start. Install the browser with npx playwright install chromium. ${error.message}`
    );
  }
  const screenshots = [];
  const consoleIssues = [];
  const assertions = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: {
          width: viewport.width,
          height: viewport.height
        }
      });
      await context.addInitScript((ownerToken) => {
        window.sessionStorage.setItem("companycoreOwnerToken", ownerToken);
      }, token);

      const page = await context.newPage();
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) {
          consoleIssues.push({
            viewport: viewport.name,
            type: message.type(),
            text: message.text()
          });
        }
      });
      page.on("pageerror", (error) => {
        consoleIssues.push({
          viewport: viewport.name,
          type: "pageerror",
          text: error.message
        });
      });

      for (const route of routes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
        await waitForConsoleHydration(page);
        const routeTitle = await page.locator("#routeTitle").innerText().catch(() => "");
        const bodyRoute = await page.locator("body").getAttribute("data-route");
        assertions.push({
          viewport: viewport.name,
          route,
          renderedRoute: bodyRoute,
          routeTitle,
          signedIn: await page.locator("body.is-signed-in").count() === 1
        });
        screenshots.push({
          viewport: viewport.name,
          route,
          file: await screenshot(page, `${viewport.name}-${slug(route)}.png`)
        });
      }

      if (viewport.name === "desktop") {
        await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
        await waitForConsoleHydration(page);
        await page.locator("#moduleSearch").fill("api");
        await page.waitForSelector("#moduleResults:not([hidden])", { timeout: 5000 });
        screenshots.push({
          viewport: viewport.name,
          route: "/dashboard",
          interaction: "module switcher search for api",
          file: await screenshot(page, "desktop-dashboard-module-switcher-api.png")
        });

        await page.goto(`${baseUrl}/data`, { waitUntil: "domcontentloaded" });
        await waitForConsoleHydration(page);
        await page.locator("#dataSearch").fill("tasks");
        await page.waitForTimeout(250);
        screenshots.push({
          viewport: viewport.name,
          route: "/data",
          interaction: "data filter search for tasks",
          file: await screenshot(page, "desktop-data-filter-tasks.png")
        });

        await page.goto(`${baseUrl}/data/tasks`, { waitUntil: "domcontentloaded" });
        await waitForConsoleHydration(page);
        const newDraft = page.locator('[data-table-action="new-draft"]');
        if (await newDraft.count()) {
          await newDraft.click();
          await page.waitForTimeout(250);
        }
        screenshots.push({
          viewport: viewport.name,
          route: "/data/tasks",
          interaction: "task typed editor draft state without submit",
          file: await screenshot(page, "desktop-data-tasks-editor-draft.png")
        });

        await page.goto(`${baseUrl}/settings/drive`, { waitUntil: "domcontentloaded" });
        await waitForConsoleHydration(page);
        assertions.push({
          viewport: viewport.name,
          route: "/settings/drive",
          control: "googleDriveImportButton",
          disabled: await page.locator("#googleDriveImportButton").isDisabled()
        });
        screenshots.push({
          viewport: viewport.name,
          route: "/settings/drive",
          interaction: "disabled provider setup controls",
          file: await screenshot(page, "desktop-drive-disabled-setup-state.png")
        });
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const report = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    health: health.data || health,
    ownerEmail,
    routes,
    viewports,
    screenshots,
    assertions,
    consoleIssues
  };
  const reportPath = path.join(outputRoot, "report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  const failedAssertions = assertions.filter((assertion) => assertion.signedIn === false || assertion.disabled === false);
  if (consoleIssues.length > 0 || failedAssertions.length > 0) {
    console.error(`CompanyCore owner-console UX smoke failed. Artifacts: ${outputRoot}`);
    console.error(JSON.stringify({ consoleIssues, failedAssertions }, null, 2));
    process.exit(1);
  }

  console.log(`CompanyCore owner-console UX smoke passed. Artifacts: ${outputRoot}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
