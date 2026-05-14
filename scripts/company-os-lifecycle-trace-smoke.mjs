import { strict as assert } from "node:assert";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createApp } = require("../dist/app.js");
const { prisma } = require("../dist/db/prisma.js");

const label = `v1evid-${Date.now()}`;
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

async function main() {
  await listen();
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await request(baseUrl, "/health");
  await expectStatus(health, 200, "health");

  const registered = await request(baseUrl, "/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: `${label}@example.com`,
      password: "very-strong-password",
      name: "V1 Evidence Owner",
      workspaceName: `V1 Evidence ${label}`
    })
  });
  await expectStatus(registered, 201, "register owner");
  const token = registered.body.data.token;
  const workspaceId = registered.body.data.workspace.id;
  const headers = authHeaders(token);

  const humanOwnerRole = await prisma.companyRole.create({
    data: {
      workspaceId,
      name: `${label} Human Owner`,
      type: "human",
      responsibilities: ["Approve high-risk Company OS lifecycle smoke actions."],
      permissions: ["approval:decide"]
    }
  });
  const agentRole = await prisma.companyRole.create({
    data: {
      workspaceId,
      name: `${label} Agent Operator`,
      type: "agent",
      responsibilities: ["Execute Company OS lifecycle smoke stages."],
      permissions: ["approval:request", "stage:execute"]
    }
  });
  const process = await prisma.process.create({
    data: {
      workspaceId,
      name: `${label} Evidence Process`,
      description: "Disposable local Company OS lifecycle trace process.",
      ownerRoleId: agentRole.id,
      status: "active"
    }
  });
  const pipeline = await prisma.pipeline.create({
    data: {
      workspaceId,
      processId: process.id,
      name: `${label} Evidence Pipeline`,
      purpose: "Exercise approval, stage, automation, event, and audit evidence.",
      defaultOwnerRoleId: agentRole.id,
      status: "active",
      isAutomatable: true,
      riskLevel: "high"
    }
  });
  const procedure = await prisma.procedure.create({
    data: {
      workspaceId,
      processId: process.id,
      name: `${label} Evidence Procedure`,
      purpose: "Validate the local V1 Company OS trace.",
      ownerRoleId: agentRole.id,
      status: "active"
    }
  });
  const stage = await prisma.pipelineStage.create({
    data: {
      workspaceId,
      pipelineId: pipeline.id,
      name: `${label} Evidence Stage`,
      description: "Disposable stage used by the V1 evidence smoke.",
      position: 1,
      assignedRoleId: agentRole.id,
      procedureId: procedure.id,
      requiredTools: ["companycore"],
      requiredApprovals: [{ action: "complete_stage", roleId: humanOwnerRole.id }],
      status: "active"
    }
  });
  const pipelineRun = await prisma.pipelineRun.create({
    data: {
      workspaceId,
      pipelineId: pipeline.id,
      initiatedByType: "system",
      initiatedById: label,
      status: "pending",
      inputPayload: { source: "company-os-lifecycle-trace-smoke" },
      correlationId: `${label}-pipeline`
    }
  });
  const stageRun = await prisma.stageRun.create({
    data: {
      workspaceId,
      pipelineRunId: pipelineRun.id,
      pipelineStageId: stage.id,
      assignedActorType: "agent",
      assignedActorId: agentRole.id,
      status: "pending",
      inputPayload: { source: "company-os-lifecycle-trace-smoke" }
    }
  });
  const acceptanceCriterion = await prisma.acceptanceCriterion.create({
    data: {
      workspaceId,
      targetType: "stage_run",
      targetId: stageRun.id,
      text: "Lifecycle trace has event and audit readback evidence.",
      required: true,
      pipelineRunId: pipelineRun.id,
      stageRunId: stageRun.id
    }
  });

  const approvalRequest = await request(baseUrl, "/v1/company-os/approvals/request", {
    method: "POST",
    headers,
    body: JSON.stringify({
      requestedByType: "agent",
      requestedById: agentRole.id,
      requestedForAction: "v1.lifecycle.trace",
      resourceType: "stage_run",
      resourceId: stageRun.id,
      riskLevel: "high",
      approverRoleId: humanOwnerRole.id,
      pipelineRunId: pipelineRun.id,
      stageRunId: stageRun.id,
      inputPayload: { source: label }
    })
  });
  await expectStatus(approvalRequest, 201, "approval request");
  const approvalId = approvalRequest.body.data.id;
  assert.equal(approvalRequest.body.data.status, "pending");
  assert.ok(approvalRequest.body.data.auditLogId);

  const approvalAudit = await request(baseUrl, `/v1/company-os/audit-logs/${approvalRequest.body.data.auditLogId}`, { headers });
  await expectStatus(approvalAudit, 200, "approval audit readback");
  assert.equal(approvalAudit.body.data.action, "approval.requested");

  const approvalDecision = await request(baseUrl, `/v1/company-os/approvals/${approvalId}/decision`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      decision: "approved",
      decisionReason: "Local V1 evidence trace is scoped and disposable."
    })
  });
  await expectStatus(approvalDecision, 200, "approval decision");
  assert.equal(approvalDecision.body.data.status, "approved");

  const startStage = await request(baseUrl, `/v1/company-os/pipeline-runs/${pipelineRun.id}/actions/start-stage`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      pipelineStageId: stage.id,
      assignedActorType: "agent",
      assignedActorId: agentRole.id,
      approvalId,
      inputPayload: { source: label }
    })
  });
  await expectStatus(startStage, 200, "start stage");
  assert.equal(startStage.body.data.status, "running");
  assert.ok(startStage.body.data.auditLogId);

  const validateStage = await request(baseUrl, `/v1/company-os/stage-runs/${stageRun.id}/actions/validate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      validationStatus: "passed",
      validationResult: { checkedBy: "company-os-lifecycle-trace-smoke" },
      acceptanceCriteria: [{
        id: acceptanceCriterion.id,
        validationStatus: "passed",
        evidence: { traceId: label }
      }]
    })
  });
  await expectStatus(validateStage, 200, "validate stage");
  assert.equal(validateStage.body.data.validationResult.status, "passed");

  const completeStage = await request(baseUrl, `/v1/company-os/stage-runs/${stageRun.id}/actions/complete`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      approvalId,
      outputPayload: { result: "v1-company-os-lifecycle-trace-complete" },
      validationResult: { acceptance: "passed" }
    })
  });
  await expectStatus(completeStage, 200, "complete stage");
  assert.equal(completeStage.body.data.status, "completed");

  const completeAudit = await request(baseUrl, `/v1/company-os/audit-logs/${completeStage.body.data.auditLogId}`, { headers });
  await expectStatus(completeAudit, 200, "stage completion audit readback");
  assert.equal(completeAudit.body.data.action, "stage_run.completed");

  const eventsAfterLifecycle = await request(baseUrl, "/v1/events", { headers });
  await expectStatus(eventsAfterLifecycle, 200, "event stream readback");
  const eventTypes = eventsAfterLifecycle.body.data
    .filter((event) => event.workspaceId === workspaceId)
    .map((event) => event.type);
  for (const expectedType of ["approval_requested", "approval_approved", "stage_started", "stage_validated", "stage_completed"]) {
    assert.ok(eventTypes.includes(expectedType), `expected event ${expectedType}`);
  }
  const stageCompletedEvent = eventsAfterLifecycle.body.data.find((event) => (
    event.workspaceId === workspaceId
    && event.type === "stage_completed"
    && event.resourceId === stageRun.id
  ));
  assert.ok(stageCompletedEvent);

  const automationRule = await prisma.automationRule.create({
    data: {
      workspaceId,
      name: `${label} Emit follow-up event`,
      pipelineId: pipeline.id,
      condition: { eventType: "stage_completed" },
      action: {
        type: "emit_event",
        eventType: "v1_lifecycle_followup_needed",
        payload: { traceId: label }
      },
      status: "active",
      triggers: {
        create: [{
          workspaceId,
          sourceType: "system_event",
          eventType: "stage_completed",
          status: "active"
        }]
      }
    }
  });

  const automationDryRun = await request(baseUrl, `/v1/company-os/events/${stageCompletedEvent.id}/actions/evaluate-automation-rules`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "dry_run",
      ruleIds: [automationRule.id]
    })
  });
  await expectStatus(automationDryRun, 200, "automation dry-run");
  assert.deepEqual(automationDryRun.body.data.matchedRuleIds, [automationRule.id]);
  assert.equal(automationDryRun.body.data.proposals[0].actionKind, "emit_event");
  assert.equal(automationDryRun.body.data.executed.length, 0);

  const automationExecute = await request(baseUrl, `/v1/company-os/events/${stageCompletedEvent.id}/actions/evaluate-automation-rules`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "execute",
      ruleIds: [automationRule.id],
      idempotencyKey: label
    })
  });
  await expectStatus(automationExecute, 200, "automation execute");
  assert.equal(automationExecute.body.data.executed.length, 1);
  assert.equal(automationExecute.body.data.executed[0].actionKind, "emit_event");
  assert.ok(automationExecute.body.data.emittedEventIds.length >= 3);
  assert.ok(automationExecute.body.data.auditLogIds.length >= 2);

  const automationAudit = await request(baseUrl, `/v1/company-os/audit-logs/${automationExecute.body.data.auditLogIds[0]}`, { headers });
  await expectStatus(automationAudit, 200, "automation audit readback");
  assert.equal(automationAudit.body.data.resourceId, stageCompletedEvent.id);

  const eventsAfterAutomation = await request(baseUrl, "/v1/events", { headers });
  await expectStatus(eventsAfterAutomation, 200, "automation event readback");
  assert.ok(eventsAfterAutomation.body.data.some((event) => (
    event.workspaceId === workspaceId
    && event.type === "v1_lifecycle_followup_needed"
    && event.resourceId === stageRun.id
  )));

  const snapshot = await request(baseUrl, "/v1/company-os", { headers });
  await expectStatus(snapshot, 200, "company os snapshot");
  assert.ok(snapshot.body.data.counts.runtime.events >= 8);
  assert.ok(snapshot.body.data.counts.runtime.auditLogs >= 7);

  const summary = {
    ok: true,
    traceId: label,
    workspaceId,
    approvalId,
    pipelineRunId: pipelineRun.id,
    stageRunId: stageRun.id,
    automationRuleId: automationRule.id,
    eventTypesVerified: [
      "approval_requested",
      "approval_approved",
      "stage_started",
      "stage_validated",
      "stage_completed",
      "v1_lifecycle_followup_needed"
    ],
    auditActionsVerified: [
      "approval.requested",
      "stage_run.completed",
      "automation_rule.matched"
    ],
    eventCount: snapshot.body.data.counts.runtime.events,
    auditLogCount: snapshot.body.data.counts.runtime.auditLogs
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(close);
