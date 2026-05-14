import { strict as assert } from "node:assert";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createApp } = require("../dist/app.js");
const { prisma } = require("../dist/db/prisma.js");

const label = `v1evid-om-${Date.now()}`;
const app = createApp();
const server = app.listen(0);

function listen() {
  return new Promise((resolve) => {
    server.once("listening", resolve);
  });
}

async function close() {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  await prisma.$disconnect();
}

async function request(baseUrl, path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null
  };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function expectStatus(response, status, context) {
  assert.equal(
    response.status,
    status,
    `${context} expected ${status}, got ${response.status}: ${JSON.stringify(response.body)}`
  );
}

async function registerOwner(baseUrl, suffix) {
  const response = await request(baseUrl, "/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: `${label}-${suffix}@example.com`,
      password: "very-strong-password",
      name: `Registry Smoke ${suffix}`,
      workspaceName: `Registry Smoke ${label} ${suffix}`
    })
  });
  await expectStatus(response, 201, `register owner ${suffix}`);
  return response.body.data;
}

function selectArea(operatingModel) {
  const area = operatingModel.areas.find((candidate) => candidate.key !== "main-general")
    ?? operatingModel.areas[0];
  assert.ok(area?.id, "expected an operating area");
  return area;
}

async function main() {
  await listen();
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await request(baseUrl, "/health");
  await expectStatus(health, 200, "health");

  const ownerA = await registerOwner(baseUrl, "a");
  const ownerB = await registerOwner(baseUrl, "b");
  const authA = authHeaders(ownerA.token);
  const authB = authHeaders(ownerB.token);

  const initialModel = await request(baseUrl, "/v1/operating-model", { headers: authA });
  await expectStatus(initialModel, 200, "initial operating model");
  const area = selectArea(initialModel.body.data);

  const createdFolder = await request(baseUrl, "/v1/operating-model/folders", {
    method: "POST",
    headers: authA,
    body: JSON.stringify({
      areaId: area.id,
      key: label,
      name: `${label} Folder`,
      description: "Disposable registry lifecycle smoke folder."
    })
  });
  await expectStatus(createdFolder, 201, "create folder");
  const folderId = createdFolder.body.data.id;
  assert.equal(createdFolder.body.data.areaId, area.id);

  const readFolder = await request(baseUrl, `/v1/operating-model/folders/${folderId}`, { headers: authA });
  await expectStatus(readFolder, 200, "read folder");
  assert.equal(readFolder.body.data.id, folderId);

  const updatedFolder = await request(baseUrl, `/v1/operating-model/folders/${folderId}`, {
    method: "PATCH",
    headers: authA,
    body: JSON.stringify({
      name: `${label} Reviewed Folder`,
      description: "Updated by V1EVID-002."
    })
  });
  await expectStatus(updatedFolder, 200, "update folder");
  assert.equal(updatedFolder.body.data.name, `${label} Reviewed Folder`);

  const createdStorage = await request(baseUrl, "/v1/operating-model/storage-locations", {
    method: "POST",
    headers: authA,
    body: JSON.stringify({
      areaId: area.id,
      folderId,
      provider: "local",
      name: `${label} Storage`,
      locator: {
        path: `/tmp/companycore/${label}/storage`
      }
    })
  });
  await expectStatus(createdStorage, 201, "create storage location");
  const storageId = createdStorage.body.data.id;

  const readStorage = await request(baseUrl, `/v1/operating-model/storage-locations/${storageId}`, { headers: authA });
  await expectStatus(readStorage, 200, "read storage location");
  assert.equal(readStorage.body.data.folderId, folderId);

  const updatedStorage = await request(baseUrl, `/v1/operating-model/storage-locations/${storageId}`, {
    method: "PATCH",
    headers: authA,
    body: JSON.stringify({
      name: `${label} Reviewed Storage`,
      locator: {
        path: `/tmp/companycore/${label}/storage-reviewed`
      }
    })
  });
  await expectStatus(updatedStorage, 200, "update storage location");
  assert.equal(updatedStorage.body.data.name, `${label} Reviewed Storage`);

  const createdKnowledgeRoot = await request(baseUrl, "/v1/operating-model/knowledge-roots", {
    method: "POST",
    headers: authA,
    body: JSON.stringify({
      areaId: area.id,
      folderId,
      provider: "local",
      name: `${label} Knowledge Root`,
      locator: {
        path: `/tmp/companycore/${label}/knowledge`
      }
    })
  });
  await expectStatus(createdKnowledgeRoot, 201, "create knowledge root");
  const knowledgeRootId = createdKnowledgeRoot.body.data.id;

  const readKnowledgeRoot = await request(baseUrl, `/v1/operating-model/knowledge-roots/${knowledgeRootId}`, { headers: authA });
  await expectStatus(readKnowledgeRoot, 200, "read knowledge root");
  assert.equal(readKnowledgeRoot.body.data.folderId, folderId);

  const updatedKnowledgeRoot = await request(baseUrl, `/v1/operating-model/knowledge-roots/${knowledgeRootId}`, {
    method: "PATCH",
    headers: authA,
    body: JSON.stringify({
      name: `${label} Reviewed Knowledge Root`
    })
  });
  await expectStatus(updatedKnowledgeRoot, 200, "update knowledge root");
  assert.equal(updatedKnowledgeRoot.body.data.name, `${label} Reviewed Knowledge Root`);

  const createdAutomation = await request(baseUrl, "/v1/operating-model/automation-definitions", {
    method: "POST",
    headers: authA,
    body: JSON.stringify({
      areaId: area.id,
      folderId,
      provider: "companycore",
      triggerType: "manual",
      name: `${label} Automation`,
      enabled: true,
      config: {
        smoke: true,
        traceId: label
      }
    })
  });
  await expectStatus(createdAutomation, 201, "create automation definition");
  const automationId = createdAutomation.body.data.id;
  assert.equal(createdAutomation.body.data.enabled, true);

  const readAutomation = await request(baseUrl, `/v1/operating-model/automation-definitions/${automationId}`, { headers: authA });
  await expectStatus(readAutomation, 200, "read automation definition");
  assert.equal(readAutomation.body.data.folderId, folderId);

  const updatedAutomation = await request(baseUrl, `/v1/operating-model/automation-definitions/${automationId}`, {
    method: "PATCH",
    headers: authA,
    body: JSON.stringify({
      enabled: false,
      config: {
        smoke: true,
        traceId: label,
        reviewed: true
      }
    })
  });
  await expectStatus(updatedAutomation, 200, "update automation definition");
  assert.equal(updatedAutomation.body.data.enabled, false);

  const modelReadback = await request(baseUrl, "/v1/operating-model", { headers: authA });
  await expectStatus(modelReadback, 200, "operating model aggregate readback");
  assert.ok(modelReadback.body.data.storageLocations.some((item) => item.id === storageId));
  assert.ok(modelReadback.body.data.knowledgeRoots.some((item) => item.id === knowledgeRootId));
  assert.ok(modelReadback.body.data.automationDefinitions.some((item) => item.id === automationId));

  const foreignStorage = await request(baseUrl, "/v1/operating-model/storage-locations", {
    method: "POST",
    headers: authB,
    body: JSON.stringify({
      areaId: area.id,
      folderId,
      provider: "local",
      name: `${label} Foreign Storage`,
      locator: { path: "/tmp/foreign" }
    })
  });
  await expectStatus(foreignStorage, 404, "foreign storage create denied");

  const foreignAutomationUpdate = await request(baseUrl, `/v1/operating-model/automation-definitions/${automationId}`, {
    method: "PATCH",
    headers: authB,
    body: JSON.stringify({ enabled: true })
  });
  await expectStatus(foreignAutomationUpdate, 404, "foreign automation update denied");

  const deletedAutomation = await request(baseUrl, `/v1/operating-model/automation-definitions/${automationId}`, {
    method: "DELETE",
    headers: authA
  });
  await expectStatus(deletedAutomation, 200, "delete automation definition");
  assert.equal(deletedAutomation.body.data.deleted, true);

  const deletedKnowledgeRoot = await request(baseUrl, `/v1/operating-model/knowledge-roots/${knowledgeRootId}`, {
    method: "DELETE",
    headers: authA
  });
  await expectStatus(deletedKnowledgeRoot, 200, "delete knowledge root");
  assert.equal(deletedKnowledgeRoot.body.data.deleted, true);

  const deletedStorage = await request(baseUrl, `/v1/operating-model/storage-locations/${storageId}`, {
    method: "DELETE",
    headers: authA
  });
  await expectStatus(deletedStorage, 200, "delete storage location");
  assert.equal(deletedStorage.body.data.deleted, true);

  const deletedFolder = await request(baseUrl, `/v1/operating-model/folders/${folderId}`, {
    method: "DELETE",
    headers: authA
  });
  await expectStatus(deletedFolder, 200, "delete folder");
  assert.equal(deletedFolder.body.data.deleted, true);

  for (const [path, context] of [
    [`/v1/operating-model/folders/${folderId}`, "folder deleted readback"],
    [`/v1/operating-model/storage-locations/${storageId}`, "storage deleted readback"],
    [`/v1/operating-model/knowledge-roots/${knowledgeRootId}`, "knowledge root deleted readback"],
    [`/v1/operating-model/automation-definitions/${automationId}`, "automation deleted readback"]
  ]) {
    const response = await request(baseUrl, path, { headers: authA });
    await expectStatus(response, 404, context);
  }

  const summary = {
    ok: true,
    traceId: label,
    workspaceId: ownerA.workspace.id,
    areaId: area.id,
    folderId,
    storageId,
    knowledgeRootId,
    automationId,
    verified: [
      "folder:create/read/update/delete",
      "storage-location:create/read/update/delete",
      "knowledge-root:create/read/update/delete",
      "automation-definition:create/read/update/delete",
      "aggregate-readback",
      "cross-workspace-deny"
    ]
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(close);
