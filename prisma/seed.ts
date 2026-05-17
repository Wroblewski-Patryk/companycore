import { PrismaClient } from "@prisma/client";
import { createHmac, randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);
const keyLength = 64;

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

function hashApiKey(apiKey: string) {
  const secret =
    process.env.API_KEY_HASH_SECRET ??
    process.env.AUTH_TOKEN_SECRET ??
    "companycore-api-key-hash-secret";

  return createHmac("sha256", secret).update(apiKey).digest("hex");
}

function apiKeyPrefix(apiKey: string) {
  return apiKey.slice(0, 10);
}

const operatingAreas = [
  { key: "strategy-governance", name: "Strategy and governance", position: 1 },
  { key: "projects-delivery", name: "Projects and delivery", position: 2 },
  { key: "tasks-workflow", name: "Tasks and workflow", position: 3 },
  { key: "sales-crm", name: "Sales and CRM", position: 4 },
  { key: "marketing-growth", name: "Marketing and growth", position: 5 },
  { key: "finance-billing", name: "Finance and billing", position: 6 },
  { key: "people-roles", name: "People and roles", position: 7 },
  { key: "operations-administration", name: "Operations and administration", position: 8 },
  { key: "knowledge-decisions", name: "Knowledge and decisions", position: 9 },
  { key: "assets-storage", name: "Assets and storage", position: 10 },
  { key: "automations-integrations", name: "Automations and integrations", position: 11 },
  { key: "ai-agents-observability", name: "AI agents and observability", position: 12 }
] as const;

const operatingTables = [
  ["projects-delivery", "projects", "projects", "Projects"],
  ["strategy-governance", "goals", "goals", "Goals"],
  ["strategy-governance", "targets", "targets", "Targets"],
  ["tasks-workflow", "task_lists", "task-lists", "Task lists"],
  ["tasks-workflow", "tasks", "tasks", "Tasks"],
  ["sales-crm", "clients", "clients", "Clients"],
  ["sales-crm", "pipeline_stages", "pipeline-stages", "Pipeline stages"],
  ["sales-crm", "deals", "deals", "Deals"],
  ["sales-crm", "interactions", "interactions", "Interactions"],
  ["knowledge-decisions", "notes", "notes", "Notes"],
  ["knowledge-decisions", "decisions", "decisions", "Decisions"],
  ["ai-agents-observability", "agents", "agents", "Agents"],
  ["ai-agents-observability", "agent_logs", "agent-logs", "Agent logs"],
  ["ai-agents-observability", "events", "events", "Events"],
  ["strategy-governance", "processes", "processes", "Processes"],
  ["tasks-workflow", "pipelines", "pipelines", "Pipelines"],
  ["tasks-workflow", "pipeline_runs", "pipeline-runs", "Pipeline runs"],
  ["tasks-workflow", "stage_runs", "stage-runs", "Stage runs"],
  ["tasks-workflow", "checklist_templates", "checklist-templates", "Checklist templates"],
  ["tasks-workflow", "checklist_items", "checklist-items", "Checklist items"],
  ["tasks-workflow", "acceptance_criteria", "acceptance-criteria", "Acceptance criteria"],
  ["strategy-governance", "policies", "policies", "Policies"],
  ["strategy-governance", "metrics", "metrics", "Metrics"],
  ["strategy-governance", "risks", "risks", "Risks"],
  ["strategy-governance", "controls", "controls", "Controls"],
  ["operations-administration", "procedures", "procedures", "Procedures"],
  ["operations-administration", "procedure_steps", "procedure-steps", "Procedure steps"],
  ["operations-administration", "approvals", "approvals", "Approvals"],
  ["operations-administration", "dependencies", "dependencies", "Dependencies"],
  ["operations-administration", "business_functions", "business-functions", "Business functions"],
  ["people-roles", "company_roles", "company-roles", "Company roles"],
  ["people-roles", "workforce_entities", "workforce", "Workforce entities"],
  ["sales-crm", "stakeholders", "stakeholders", "Stakeholders"],
  ["assets-storage", "resources", "resources", "Resources"],
  ["assets-storage", "artifacts", "artifacts", "Artifacts"],
  ["automations-integrations", "tool_adapters", "tool-adapters", "Tool adapters"],
  ["automations-integrations", "integration_capabilities", "integration-capabilities", "Integration capabilities"],
  ["automations-integrations", "automation_rules", "automation-rules", "Automation rules"],
  ["automations-integrations", "triggers", "triggers", "Triggers"],
  ["ai-agents-observability", "audit_logs", "audit-logs", "Audit logs"],
  ["knowledge-decisions", "knowledge_items", "knowledge-items", "Knowledge items"],
  ["knowledge-decisions", "decision_logs", "decision-logs", "Decision logs"],
  ["knowledge-decisions", "standards", "standards", "Standards"]
] as const;

async function ensureSeedOperatingModel(workspaceId: string) {
  const areaByKey = new Map<string, { id: string }>();

  for (const area of operatingAreas) {
    const record = await prisma.operatingArea.upsert({
      where: {
        workspaceId_key: {
          workspaceId,
          key: area.key
        }
      },
      update: {
        name: area.name,
        position: area.position
      },
      create: {
        workspaceId,
        key: area.key,
        name: area.name,
        position: area.position
      },
      select: { id: true }
    });
    areaByKey.set(area.key, record);
  }

  for (const [areaKey, tableName, apiSlug, name] of operatingTables) {
    const area = areaByKey.get(areaKey)!;
    await prisma.operatingTable.upsert({
      where: {
        workspaceId_apiSlug: {
          workspaceId,
          apiSlug
        }
      },
      update: {
        areaId: area.id,
        tableName,
        name,
        source: "companycore"
      },
      create: {
        workspaceId,
        areaId: area.id,
        tableName,
        apiSlug,
        name,
        source: "companycore"
      }
    });
  }
}

const companyRoleSeeds = [
  {
    name: "Human Owner",
    type: "human",
    responsibilities: ["Final approval", "risk escalation", "business priority"],
    permissions: ["approval:decide", "workspace:admin"],
    allowedTools: ["companycore"]
  },
  {
    name: "CEO Agent",
    type: "agent",
    responsibilities: ["company prioritization", "cross-process monitoring"],
    permissions: ["process:read", "pipeline:read", "decision:propose"],
    allowedTools: ["companycore", "clickup", "google_drive"]
  },
  {
    name: "CTO Agent",
    type: "agent",
    responsibilities: ["architecture review", "technical risk control"],
    permissions: ["process:read", "pipeline:write", "procedure:write"],
    allowedTools: ["companycore", "github", "coolify"]
  },
  {
    name: "Project Manager Agent",
    type: "agent",
    responsibilities: ["task planning", "pipeline coordination", "status reporting"],
    permissions: ["task:write", "pipeline:read", "approval:request"],
    allowedTools: ["companycore", "clickup", "google_drive"]
  },
  {
    name: "Developer Agent",
    type: "agent",
    responsibilities: ["implementation", "test execution", "technical reporting"],
    permissions: ["task:read", "artifact:create", "log:write"],
    allowedTools: ["companycore", "github", "coolify"]
  },
  {
    name: "QA Agent",
    type: "agent",
    responsibilities: ["validation", "regression checks", "quality evidence"],
    permissions: ["task:read", "standard:read", "log:write"],
    allowedTools: ["companycore", "clickup", "github"]
  },
  {
    name: "Documentation Agent",
    type: "agent",
    responsibilities: ["documentation updates", "knowledge linking", "decision capture"],
    permissions: ["document:write", "knowledge:write", "decision:write"],
    allowedTools: ["companycore", "google_drive"]
  },
  {
    name: "Sales Agent",
    type: "agent",
    responsibilities: ["lead qualification", "offer preparation", "client handoff"],
    permissions: ["client:write", "deal:write", "approval:request"],
    allowedTools: ["companycore", "clickup", "google_drive"]
  },
  {
    name: "Finance Agent",
    type: "agent",
    responsibilities: ["billing preparation", "finance control checks"],
    permissions: ["resource:read", "approval:request"],
    allowedTools: ["companycore", "google_drive"]
  }
] as const;

const adapterSeeds = [
  {
    provider: "clickup",
    name: "ClickUp",
    authType: "api_key",
    connectionStatus: "configured",
    capabilities: ["read_task", "create_task", "update_task", "comment_task"]
  },
  {
    provider: "google_drive",
    name: "Google Drive",
    authType: "oauth",
    connectionStatus: "disconnected",
    capabilities: ["read_file", "create_file", "update_file", "search_files", "create_folder"]
  },
  {
    provider: "github",
    name: "GitHub",
    authType: "oauth",
    connectionStatus: "disconnected",
    capabilities: ["read_logs", "deploy_app"]
  },
  {
    provider: "coolify",
    name: "Coolify",
    authType: "api_key",
    connectionStatus: "disconnected",
    capabilities: ["deploy_app", "read_logs"]
  },
  {
    provider: "n8n",
    name: "n8n",
    authType: "webhook_secret",
    connectionStatus: "disconnected",
    capabilities: ["create_calendar_event"]
  }
] as const;

const pipelineSeeds = [
  {
    processName: "Feature development",
    department: "Product",
    ownerRole: "CTO Agent",
    pipelineName: "Feature Development Pipeline",
    purpose: "Move a product idea through architecture, implementation, validation, deploy, monitoring, and documentation.",
    riskLevel: "high",
    stages: [
      "Idea",
      "Architecture Review",
      "Task Planning",
      "Implementation",
      "Tests",
      "UI Review",
      "Security Review",
      "Deploy",
      "Monitoring",
      "Documentation Update"
    ]
  },
  {
    processName: "Client onboarding",
    department: "Customer Success",
    ownerRole: "Project Manager Agent",
    pipelineName: "Client Onboarding Pipeline",
    purpose: "Convert a lead into an approved, prepared, and kicked-off delivery project.",
    riskLevel: "medium",
    stages: [
      "Lead",
      "Discovery",
      "Offer",
      "Contract/Approval",
      "Project Setup",
      "Drive Folder",
      "ClickUp Tasks",
      "Kickoff",
      "Delivery Plan"
    ]
  },
  {
    processName: "Content production",
    department: "Marketing",
    ownerRole: "Documentation Agent",
    pipelineName: "Content Production Pipeline",
    purpose: "Take content ideas from brief through review, publication, and analytics.",
    riskLevel: "medium",
    stages: ["Idea", "Brief", "Draft", "Review", "SEO", "Graphics", "Approval", "Publish", "Analytics"]
  },
  {
    processName: "Agent task execution",
    department: "HR / Agent Management",
    ownerRole: "Project Manager Agent",
    pipelineName: "Agent Task Execution Pipeline",
    purpose: "Guide agents from task intake through context, planning, execution, validation, reporting, and approval handoff.",
    riskLevel: "high",
    stages: [
      "Task Received",
      "Context Gathering",
      "Procedure Selection",
      "Plan",
      "Execute",
      "Validate",
      "Report",
      "Approval if needed",
      "Close"
    ]
  },
  {
    processName: "Integration onboarding",
    department: "Operations",
    ownerRole: "CTO Agent",
    pipelineName: "Integration Onboarding Pipeline",
    purpose: "Add new tool adapters through research, design, auth, capability mapping, sync tests, UI status, and documentation.",
    riskLevel: "high",
    stages: [
      "Tool Selected",
      "API Research",
      "Adapter Design",
      "Auth Setup",
      "Capabilities Mapping",
      "Test Sync",
      "UI Status",
      "Documentation"
    ]
  },
  {
    processName: "Documentation update",
    department: "Knowledge / Documentation",
    ownerRole: "Documentation Agent",
    pipelineName: "Documentation Update Pipeline",
    purpose: "Keep operational documentation synchronized with changes and related processes or tasks.",
    riskLevel: "medium",
    stages: [
      "Change Detected",
      "Affected Docs Identified",
      "Draft Update",
      "Review",
      "Publish",
      "Link to Related Process/Task"
    ]
  },
  {
    processName: "Deployment",
    department: "Engineering",
    ownerRole: "CTO Agent",
    pipelineName: "Deployment Pipeline",
    purpose: "Promote code through tests, build, deploy, health checks, log review, rollback handling, and status reporting.",
    riskLevel: "critical",
    stages: [
      "Code Ready",
      "Tests",
      "Build",
      "Deploy via Coolify/GitHub",
      "Health Check",
      "Logs Review",
      "Rollback if needed",
      "Status Report"
    ]
  }
] as const;

const businessFunctionSeeds = [
  "Strategy / CEO Office",
  "Product",
  "Engineering",
  "Design / UX",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Legal",
  "Customer Success",
  "HR / Agent Management",
  "Knowledge / Documentation"
] as const;

async function ensureCompanyOsFoundation(workspaceId: string) {
  const roleByName = new Map<string, { id: string }>();

  for (const role of companyRoleSeeds) {
    const record = await prisma.companyRole.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: role.name
        }
      },
      update: {
        type: role.type,
        responsibilities: [...role.responsibilities],
        permissions: [...role.permissions],
        allowedTools: [...role.allowedTools]
      },
      create: {
        workspaceId,
        name: role.name,
        type: role.type,
        responsibilities: [...role.responsibilities],
        permissions: [...role.permissions],
        allowedTools: [...role.allowedTools]
      },
      select: { id: true }
    });
    roleByName.set(role.name, record);
  }

  const humanOwnerRole = roleByName.get("Human Owner")!;
  for (const role of companyRoleSeeds.filter((item) => item.name !== "Human Owner")) {
    const record = roleByName.get(role.name)!;
    await prisma.companyRole.update({
      where: { id: record.id },
      data: {
        escalationTargetId: humanOwnerRole.id,
        defaultPolicies: [
          "Risky external writes require approval.",
          "Agents must create events and audit evidence for significant actions."
        ]
      }
    });
  }

  const ctoRole = roleByName.get("CTO Agent")!;
  const adapterByProvider = new Map<string, { id: string }>();
  for (const adapter of adapterSeeds) {
    const adapterRecord = await prisma.toolAdapter.upsert({
      where: {
        workspaceId_provider: {
          workspaceId,
          provider: adapter.provider
        }
      },
      update: {
        name: adapter.name,
        authType: adapter.authType,
        connectionStatus: adapter.connectionStatus,
        ownerRoleId: ctoRole.id,
        configSchema: {
          credentialsReference: "integration_settings.secret_ciphertext",
          workspaceScoped: true
        }
      },
      create: {
        workspaceId,
        provider: adapter.provider,
        name: adapter.name,
        authType: adapter.authType,
        connectionStatus: adapter.connectionStatus,
        ownerRoleId: ctoRole.id,
        configSchema: {
          credentialsReference: "integration_settings.secret_ciphertext",
          workspaceScoped: true
        }
      },
      select: { id: true }
    });
    adapterByProvider.set(adapter.provider, adapterRecord);

    for (const capability of adapter.capabilities) {
      await prisma.integrationCapability.upsert({
        where: {
          toolAdapterId_capabilityKey: {
            toolAdapterId: adapterRecord.id,
            capabilityKey: capability
          }
        },
        update: {
          workspaceId,
          requiredPermissions: [`${adapter.provider}:${capability}`],
          riskLevel: ["update_file", "deploy_app"].includes(capability) ? "high" : "medium",
          requiresApproval: ["update_file", "deploy_app"].includes(capability),
          auditRequired: true
        },
        create: {
          workspaceId,
          toolAdapterId: adapterRecord.id,
          capabilityKey: capability,
          requiredPermissions: [`${adapter.provider}:${capability}`],
          riskLevel: ["update_file", "deploy_app"].includes(capability) ? "high" : "medium",
          requiresApproval: ["update_file", "deploy_app"].includes(capability),
          auditRequired: true
        }
      });
    }
  }

  const standard = await prisma.standard.upsert({
    where: {
      workspaceId_name_version: {
        workspaceId,
        name: "Company OS execution standard",
        version: 1
      }
    },
    update: {
      category: "operations",
      ownerRoleId: ctoRole.id,
      validationMethod: "Checklist, event evidence, and owner approval for high-risk actions."
    },
    create: {
      workspaceId,
      name: "Company OS execution standard",
      category: "operations",
      description: "Default quality standard for processes, pipelines, and procedures.",
      ownerRoleId: ctoRole.id,
      validationMethod: "Checklist, event evidence, and owner approval for high-risk actions."
    },
    select: { id: true }
  });

  const runChecklist = await prisma.checklistTemplate.upsert({
    where: {
      workspaceId_name_version: {
        workspaceId,
        name: "Pipeline run evidence checklist",
        version: 1
      }
    },
    update: {
      targetType: "pipeline_run",
      status: "active",
      description: "Default evidence checklist before a pipeline run can be treated as completed."
    },
    create: {
      workspaceId,
      name: "Pipeline run evidence checklist",
      description: "Default evidence checklist before a pipeline run can be treated as completed.",
      targetType: "pipeline_run",
      status: "active"
    },
    select: { id: true }
  });

  const checklistItems = [
    "Input payload and expected outcome are recorded.",
    "Each completed stage has output evidence.",
    "High-risk actions have an approval or documented blocker.",
    "Final report includes result, validation status, and next action."
  ];
  for (const [index, text] of checklistItems.entries()) {
    await prisma.checklistItem.upsert({
      where: {
        checklistTemplateId_itemOrder: {
          checklistTemplateId: runChecklist.id,
          itemOrder: index + 1
        }
      },
      update: {
        workspaceId,
        text,
        required: true,
        verificationType: "human_or_agent"
      },
      create: {
        workspaceId,
        checklistTemplateId: runChecklist.id,
        itemOrder: index + 1,
        text,
        required: true,
        verificationType: "human_or_agent"
      }
    });
  }

  for (const pipelineSeed of pipelineSeeds) {
    const ownerRole = roleByName.get(pipelineSeed.ownerRole) ?? ctoRole;
    const process = await prisma.process.upsert({
      where: {
        workspaceId_name_version: {
          workspaceId,
          name: pipelineSeed.processName,
          version: 1
        }
      },
      update: {
        description: `${pipelineSeed.processName} operating process for LuckySparrow Company OS.`,
        ownerRoleId: ownerRole.id,
        department: pipelineSeed.department,
        category: "company_os",
        status: "active",
        maturityLevel: "defined"
      },
      create: {
        workspaceId,
        name: pipelineSeed.processName,
        description: `${pipelineSeed.processName} operating process for LuckySparrow Company OS.`,
        ownerRoleId: ownerRole.id,
        department: pipelineSeed.department,
        category: "company_os",
        status: "active",
        maturityLevel: "defined"
      },
      select: { id: true }
    });

    const pipeline = await prisma.pipeline.upsert({
      where: {
        workspaceId_name_version: {
          workspaceId,
          name: pipelineSeed.pipelineName,
          version: 1
        }
      },
      update: {
        processId: process.id,
        purpose: pipelineSeed.purpose,
        triggerType: "manual",
        defaultOwnerRoleId: ownerRole.id,
        status: "active",
        isAutomatable: true,
        riskLevel: pipelineSeed.riskLevel,
        inputSchema: { type: "object", required: ["context"] },
        outputSchema: { type: "object", required: ["status", "result"] }
      },
      create: {
        workspaceId,
        processId: process.id,
        name: pipelineSeed.pipelineName,
        purpose: pipelineSeed.purpose,
        triggerType: "manual",
        defaultOwnerRoleId: ownerRole.id,
        status: "active",
        isAutomatable: true,
        riskLevel: pipelineSeed.riskLevel,
        inputSchema: { type: "object", required: ["context"] },
        outputSchema: { type: "object", required: ["status", "result"] }
      },
      select: { id: true }
    });

    const procedure = await prisma.procedure.upsert({
      where: {
        workspaceId_name_version: {
          workspaceId,
          name: `${pipelineSeed.pipelineName} SOP`,
          version: 1
        }
      },
      update: {
        processId: process.id,
        purpose: `Operate ${pipelineSeed.pipelineName} consistently with audit evidence.`,
        ownerRoleId: ownerRole.id,
        status: "active",
        qualityStandardId: standard.id,
        requiredTools: ["companycore", "clickup", "google_drive"],
        requiredPermissions: ["pipeline:read", "task:write", "event:write"],
        expectedResult: "Pipeline stage is completed with output evidence, validation result, and next action."
      },
      create: {
        workspaceId,
        processId: process.id,
        name: `${pipelineSeed.pipelineName} SOP`,
        purpose: `Operate ${pipelineSeed.pipelineName} consistently with audit evidence.`,
        scope: pipelineSeed.pipelineName,
        ownerRoleId: ownerRole.id,
        status: "active",
        qualityStandardId: standard.id,
        requiredTools: ["companycore", "clickup", "google_drive"],
        requiredPermissions: ["pipeline:read", "task:write", "event:write"],
        expectedResult: "Pipeline stage is completed with output evidence, validation result, and next action."
      },
      select: { id: true }
    });

    for (const [index, stageName] of pipelineSeed.stages.entries()) {
      const position = index + 1;
      await prisma.pipelineStage.upsert({
        where: {
          pipelineId_position: {
            pipelineId: pipeline.id,
            position
          }
        },
        update: {
          workspaceId,
          name: stageName,
          description: `${stageName} stage for ${pipelineSeed.pipelineName}.`,
          assignedRoleId: ownerRole.id,
          procedureId: procedure.id,
          requiredTools: ["companycore"],
          requiredApprovals: pipelineSeed.riskLevel === "critical" || /Approval|Deploy|Contract|Security/.test(stageName)
            ? ["Human Owner"]
            : [],
          estimatedDuration: "TBD",
          failureStrategy: "Stop, record the blocker, and request owner or accountable-role decision.",
          retryPolicy: { maxAttempts: 1, requiresReviewAfterFailure: true },
          status: "active"
        },
        create: {
          workspaceId,
          pipelineId: pipeline.id,
          name: stageName,
          position,
          description: `${stageName} stage for ${pipelineSeed.pipelineName}.`,
          expectedInput: { stage: stageName, contextRequired: true },
          expectedOutput: { stage: stageName, evidenceRequired: true },
          entryConditions: position === 1 ? ["Pipeline has approved input payload."] : ["Previous stage is completed."],
          exitConditions: ["Expected output exists.", "Validation evidence is recorded."],
          assignedRoleId: ownerRole.id,
          procedureId: procedure.id,
          requiredTools: ["companycore"],
          requiredApprovals: pipelineSeed.riskLevel === "critical" || /Approval|Deploy|Contract|Security/.test(stageName)
            ? ["Human Owner"]
            : [],
          estimatedDuration: "TBD",
          failureStrategy: "Stop, record the blocker, and request owner or accountable-role decision.",
          retryPolicy: { maxAttempts: 1, requiresReviewAfterFailure: true },
          status: "active"
        }
      });

      await prisma.procedureStep.upsert({
        where: {
          procedureId_stepOrder: {
            procedureId: procedure.id,
            stepOrder: position
          }
        },
        update: {
          instruction: `Complete the ${stageName} stage, record evidence, and surface blockers before continuing.`,
          stepType: /Approval|Review/.test(stageName) ? "human_review" : "agent",
          requiredToolAdapterId: /ClickUp/.test(stageName) ? adapterByProvider.get("clickup")?.id : undefined,
          validationRule: { evidenceRequired: true, statusMustBe: "completed_or_blocked" }
        },
        create: {
          procedureId: procedure.id,
          stepOrder: position,
          instruction: `Complete the ${stageName} stage, record evidence, and surface blockers before continuing.`,
          stepType: /Approval|Review/.test(stageName) ? "human_review" : "agent",
          requiredToolAdapterId: /ClickUp/.test(stageName) ? adapterByProvider.get("clickup")?.id : undefined,
          expectedInput: { stage: stageName },
          expectedOutput: { evidence: "required", status: "completed_or_blocked" },
          validationRule: { evidenceRequired: true, statusMustBe: "completed_or_blocked" },
          rollbackInstruction: "Reopen the previous stage and attach the failure evidence."
        }
      });
    }

    await prisma.resource.upsert({
      where: {
        workspaceId_externalProvider_externalId: {
          workspaceId,
          externalProvider: "companycore",
          externalId: pipelineSeed.pipelineName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        }
      },
      update: {
        name: `${pipelineSeed.pipelineName} operating resource`,
        ownerRoleId: ownerRole.id,
        relatedProcessId: process.id,
        metadata: { pipelineName: pipelineSeed.pipelineName, department: pipelineSeed.department }
      },
      create: {
        workspaceId,
        type: "pipeline",
        externalProvider: "companycore",
        externalId: pipelineSeed.pipelineName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: `${pipelineSeed.pipelineName} operating resource`,
        ownerRoleId: ownerRole.id,
        relatedProcessId: process.id,
        metadata: { pipelineName: pipelineSeed.pipelineName, department: pipelineSeed.department }
      }
    });
  }

  for (const [index, name] of businessFunctionSeeds.entries()) {
    await prisma.businessFunction.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name
        }
      },
      update: {
        category: name.split(" / ")[0].toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        accountableRoleId: index === 0 ? roleByName.get("CEO Agent")?.id : ctoRole.id,
        status: "active"
      },
      create: {
        workspaceId,
        name,
        category: name.split(" / ")[0].toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        description: `${name} business function for LuckySparrow Company OS.`,
        accountableRoleId: index === 0 ? roleByName.get("CEO Agent")?.id : ctoRole.id,
        status: "active"
      }
    });
  }

  const deploymentPipeline = await prisma.pipeline.findUnique({
    where: {
      workspaceId_name_version: {
        workspaceId,
        name: "Deployment Pipeline",
        version: 1
      }
    },
    include: { process: true }
  });

  if (deploymentPipeline) {
    const deploymentRisk = await prisma.risk.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: "Unsafe deployment without validation"
        }
      },
      update: {
        riskLevel: "critical",
        processId: deploymentPipeline.processId,
        pipelineId: deploymentPipeline.id,
        status: "active"
      },
      create: {
        workspaceId,
        name: "Unsafe deployment without validation",
        description: "A deployment may proceed before tests, health checks, or rollback readiness are confirmed.",
        category: "deployment",
        riskLevel: "critical",
        likelihood: "medium",
        impact: "critical",
        processId: deploymentPipeline.processId,
        pipelineId: deploymentPipeline.id,
        status: "active"
      },
      select: { id: true }
    });

    await prisma.control.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: "Deployment requires test and health evidence"
        }
      },
      update: {
        riskId: deploymentRisk.id,
        ownerRoleId: ctoRole.id,
        status: "active"
      },
      create: {
        workspaceId,
        riskId: deploymentRisk.id,
        name: "Deployment requires test and health evidence",
        description: "Deploy stages require passing validation and post-deploy health evidence before status report.",
        controlType: "quality_gate",
        ownerRoleId: ctoRole.id,
        verificationMethod: "build/test output and health check evidence",
        status: "active"
      }
    });

    await prisma.metric.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: "Deployment success rate"
        }
      },
      update: {
        category: "engineering",
        processId: deploymentPipeline.processId,
        pipelineId: deploymentPipeline.id,
        ownerRoleId: ctoRole.id,
        status: "active"
      },
      create: {
        workspaceId,
        name: "Deployment success rate",
        category: "engineering",
        description: "Share of deployments that complete health checks without rollback.",
        measurementType: "ratio",
        unit: "percent",
        targetValue: 95,
        calculation: { numerator: "successful_deployments", denominator: "all_deployments" },
        processId: deploymentPipeline.processId,
        pipelineId: deploymentPipeline.id,
        ownerRoleId: ctoRole.id,
        status: "active"
      }
    });

    await prisma.policy.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: "Critical deployment actions require approval"
        }
      },
      update: {
        processId: deploymentPipeline.processId,
        enforcementMode: "require_approval",
        escalationRoleId: humanOwnerRole.id,
        status: "active"
      },
      create: {
        workspaceId,
        name: "Critical deployment actions require approval",
        description: "Agents must request approval before production deployment or rollback actions.",
        appliesTo: "pipeline",
        ruleType: "deployment_control",
        severity: "critical",
        enforcementMode: "require_approval",
        escalationRoleId: humanOwnerRole.id,
        processId: deploymentPipeline.processId,
        status: "active"
      }
    });

    await prisma.automationRule.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: "Escalate failed deployment health check"
        }
      },
      update: {
        pipelineId: deploymentPipeline.id,
        status: "active",
        condition: { eventType: "deployment_health_failed" },
        action: { requestApproval: true, notifyRole: "Human Owner" }
      },
      create: {
        workspaceId,
        name: "Escalate failed deployment health check",
        description: "If a deployment health check fails, request human approval for rollback or recovery.",
        pipelineId: deploymentPipeline.id,
        condition: { eventType: "deployment_health_failed" },
        action: { requestApproval: true, notifyRole: "Human Owner" },
        status: "active",
        triggers: {
          create: [
            {
              workspaceId,
              sourceType: "system_event",
              eventType: "deployment_health_failed",
              status: "active"
            }
          ]
        }
      }
    });

    await prisma.knowledgeItem.upsert({
      where: {
        workspaceId_sourceProvider_sourceExternalId: {
          workspaceId,
          sourceProvider: "companycore",
          sourceExternalId: "deployment-runbook"
        }
      },
      update: {
        processId: deploymentPipeline.processId,
        pipelineId: deploymentPipeline.id,
        status: "active"
      },
      create: {
        workspaceId,
        title: "Deployment runbook",
        itemType: "runbook",
        summary: "Operational knowledge linked to deployment pipeline validation and rollback.",
        sourceProvider: "companycore",
        sourceExternalId: "deployment-runbook",
        processId: deploymentPipeline.processId,
        pipelineId: deploymentPipeline.id,
        status: "active"
      }
    });
  }
}

function generatedWorkforceFiles(entity: {
  name: string;
  type: "human" | "agent";
  role?: string | null;
  department?: string | null;
  personalityProfile: string;
  runtimeMode: string;
  model?: string | null;
  paperclipAgentId?: string | null;
}) {
  return {
    "agent.md": `# ${entity.name}

## Identity
- Type: ${entity.type}
- Role: ${entity.role || "Unassigned"}
- Department: ${entity.department || "06-kadry"}

## Responsibilities
Responsibilities are defined by CompanyCore tasks, roles, and governance.

## Runtime
- Runtime mode: ${entity.runtimeMode}
- Model: ${entity.model || "not configured"}
- Paperclip agent ID: ${entity.paperclipAgentId || "not linked"}
`,
    "personality.md": `# ${entity.name} Personality

## Profile
- Personality profile: ${entity.personalityProfile}

## Communication Style
Managed by CompanyCore.

## Decision Style
Follow CompanyCore authority, evidence, and approval guardrails.
`,
    "environment.md": `# ${entity.name} Environment

CompanyCore/Roost is the organizational source of truth. Paperclip is the external runtime for synchronized agents.
`
  };
}

async function ensureWorkforceFoundation(workspaceId: string, owner: { id: string; email: string; name: string | null }) {
  await prisma.workforceEntity.upsert({
    where: {
      workspaceId_source_externalId: {
        workspaceId,
        source: "user",
        externalId: owner.id
      }
    },
    update: {
      name: owner.name || owner.email,
      department: "06-kadry",
      role: "Owner",
      personalityProfile: "executive",
      runtimeMode: "manual",
      generatedFiles: generatedWorkforceFiles({
        name: owner.name || owner.email,
        type: "human",
        role: "Owner",
        department: "06-kadry",
        personalityProfile: "executive",
        runtimeMode: "manual"
      })
    },
    create: {
      workspaceId,
      type: "human",
      status: "active",
      name: owner.name || owner.email,
      slug: `owner-${owner.id.slice(0, 8)}`,
      department: "06-kadry",
      role: "Owner",
      personalityProfile: "executive",
      runtimeMode: "manual",
      synchronizationEnabled: false,
      generatedFiles: generatedWorkforceFiles({
        name: owner.name || owner.email,
        type: "human",
        role: "Owner",
        department: "06-kadry",
        personalityProfile: "executive",
        runtimeMode: "manual"
      }),
      source: "user",
      externalId: owner.id
    }
  });

  const agentRoles = companyRoleSeeds.filter((role) => role.type === "agent");
  for (const role of agentRoles) {
    const slug = role.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    await prisma.workforceEntity.upsert({
      where: {
        workspaceId_source_externalId: {
          workspaceId,
          source: "seed",
          externalId: slug
        }
      },
      update: {
        name: role.name,
        department: "06-kadry",
        role: role.name,
        description: role.responsibilities.join(", "),
        generatedFiles: generatedWorkforceFiles({
          name: role.name,
          type: "agent",
          role: role.name,
          department: "06-kadry",
          personalityProfile: "supportive",
          runtimeMode: "semi_autonomous",
          paperclipAgentId: slug
        })
      },
      create: {
        workspaceId,
        type: "agent",
        status: "active",
        name: role.name,
        slug,
        description: role.responsibilities.join(", "),
        department: "06-kadry",
        role: role.name,
        personalityProfile: role.name.includes("Documentation") ? "researcher" : role.name.includes("CEO") ? "executive" : "supportive",
        runtimeMode: "semi_autonomous",
        paperclipAgentId: slug,
        synchronizationEnabled: true,
        generatedFiles: generatedWorkforceFiles({
          name: role.name,
          type: "agent",
          role: role.name,
          department: "06-kadry",
          personalityProfile: "supportive",
          runtimeMode: "semi_autonomous",
          paperclipAgentId: slug
        }),
        source: "seed",
        externalId: slug
      }
    });
  }
}

async function main() {
  const key = process.env.SEED_API_KEY ?? "dev-companycore-key";
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "change-me-local-password";
  const workspaceName = process.env.SEED_WORKSPACE_NAME ?? "LuckySparrow";

  const passwordHash = await hashPassword(ownerPassword);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: "Local owner",
      passwordHash
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: "00000000-0000-4000-8000-000000000100" },
    update: {
      name: workspaceName,
      ownerUserId: owner.id
    },
    create: {
      id: "00000000-0000-4000-8000-000000000100",
      name: workspaceName,
      ownerUserId: owner.id
    }
  });

  await prisma.workspaceMembership.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: owner.id
      }
    },
    update: { role: "owner" },
    create: {
      workspaceId: workspace.id,
      userId: owner.id,
      role: "owner"
    }
  });

  await ensureSeedOperatingModel(workspace.id);
  await ensureCompanyOsFoundation(workspace.id);
  await ensureWorkforceFoundation(workspace.id, owner);

  const keyHash = hashApiKey(key);
  const existingApiKey = await prisma.apiKey.findFirst({
    where: {
      OR: [
        { keyHash },
        { key }
      ]
    }
  });

  if (existingApiKey) {
    await prisma.apiKey.update({
      where: { id: existingApiKey.id },
      data: {
        active: true,
        workspaceId: workspace.id,
        keyHash,
        keyPrefix: apiKeyPrefix(key),
        scopes: []
      }
    });
  } else {
    await prisma.apiKey.create({
      data: {
        name: "Local development key",
        key,
        keyHash,
        keyPrefix: apiKeyPrefix(key),
        scopes: [],
        workspaceId: workspace.id,
        active: true
      }
    });
  }

  const stages = ["Lead", "Qualified", "Proposal", "Won"];
  for (const [position, name] of stages.entries()) {
    await prisma.pipelineStage.upsert({
      where: { id: `00000000-0000-4000-8000-${String(position + 1).padStart(12, "0")}` },
      update: { name, position, workspaceId: workspace.id },
      create: {
        id: `00000000-0000-4000-8000-${String(position + 1).padStart(12, "0")}`,
        workspaceId: workspace.id,
        name,
        position
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
