const privateRoutes = new Set(["/dashboard", "/settings", "/settings/drive", "/settings/api"]);
const publicRoutes = new Set(["/", "/auth/login", "/auth/register"]);

const state = {
  ownerToken: sessionStorage.getItem("companycoreOwnerToken") || "",
  workspace: null,
  user: null,
  capabilities: [],
  clickup: {
    configured: false,
    active: false,
    config: {},
    workspaces: [],
    selectedWorkspace: null,
    spaces: [],
    selectedListIds: new Set()
  },
  googleDrive: {
    configured: false,
    active: false,
    config: {},
    files: []
  },
  operatingModel: {
    areas: [],
    externalMappings: [],
    externalFields: [],
    storageLocations: [],
    knowledgeRoots: [],
    automationDefinitions: []
  },
  databaseTables: new Map(),
  selectedAreaKey: "",
  tasks: []
};

const COMPANY_AREAS = [
  { number: "01", label: "Strategia", key: "strategy-governance", description: "Goals, targets, decisions, and the strategic source of truth." },
  { number: "02", label: "Produkt", key: "projects-delivery", description: "Projects, delivery containers, product work, and shipped outcomes." },
  { number: "03", label: "Sprzedaż", key: "sales-crm", description: "Clients, pipeline stages, deals, and sales interactions." },
  { number: "04", label: "Operacje", key: "operations-administration", description: "Operational administration and unclassified execution structure." },
  { number: "05", label: "Relacje", key: "tasks-workflow", description: "Workflows, task lists, ClickUp Lists, and active execution records." },
  { number: "06", label: "Kadry", key: "people-roles", description: "People, roles, responsibilities, and future HR records." },
  { number: "07", label: "Finanse", key: "finance-billing", description: "Finance, billing, payments, and future financial tables." },
  { number: "08", label: "Zasoby", key: "assets-storage", description: "Google Drive folders, files, storage locations, and document assets." },
  { number: "09", label: "Technologia", key: "automations-integrations", description: "Integrations, webhooks, provider mappings, sync jobs, and automations." },
  { number: "10", label: "Prawo", key: "knowledge-decisions", description: "Knowledge roots, notes, decisions, policies, and durable written context." },
  { number: "11", label: "Innowacje", key: "marketing-growth", description: "Growth, experiments, campaigns, and future innovation records." },
  { number: "12", label: "Zarządzanie", key: "ai-agents-observability", description: "Jarvis, Paperclip, Aviary, agent events, logs, and observability." }
];

const COMPANY_AREA_ORDER = new Map(COMPANY_AREAS.map((area, index) => [area.key, index]));

const API_ORIGIN = window.location.hostname === "companycore.luckysparrow.ch"
  ? "https://api.companycore.luckysparrow.ch"
  : window.location.origin;

const views = [...document.querySelectorAll("[data-view]")];
const privateControls = [...document.querySelectorAll("[data-private]")];
const publicControls = [...document.querySelectorAll("[data-public]")];
const links = [...document.querySelectorAll("[data-link]")];
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const logoutButton = document.querySelector("#logoutButton");
const clickupPanel = document.querySelector("#clickupPanel");
const checkTokenButton = document.querySelector("#checkTokenButton");
const refreshButton = document.querySelector("#refreshButton");
const saveButton = document.querySelector("#saveButton");
const syncButton = document.querySelector("#syncButton");
const refreshTasksButton = document.querySelector("#refreshTasksButton");
const loadListsButton = document.querySelector("#loadListsButton");
const selectAllListsButton = document.querySelector("#selectAllListsButton");
const clearListsButton = document.querySelector("#clearListsButton");
const workspaceSelect = document.querySelector("#workspaceSelect");
const connectionStatus = document.querySelector("#connectionStatus");
const workspaceLabel = document.querySelector("#workspaceLabel");
const clickupWorkspaceLabel = document.querySelector("#clickupWorkspaceLabel");
const workspaceNameLabel = document.querySelector("#workspaceNameLabel");
const clickupStatusLabel = document.querySelector("#clickupStatusLabel");
const clickupStatusHint = document.querySelector("#clickupStatusHint");
const googleDriveStatusLabel = document.querySelector("#googleDriveStatusLabel");
const googleDriveStatusHint = document.querySelector("#googleDriveStatusHint");
const capabilitySummary = document.querySelector("#capabilitySummary");
const capabilityList = document.querySelector("#capabilityList");
const operatingAreasNav = document.querySelector("#operatingAreasNav");
const areaTitle = document.querySelector("#areaTitle");
const areaDescription = document.querySelector("#areaDescription");
const areaStats = document.querySelector("#areaStats");
const areaTables = document.querySelector("#areaTables");
const areaFiles = document.querySelector("#areaFiles");
const areaMappings = document.querySelector("#areaMappings");
const areaRecords = document.querySelector("#areaRecords");
const dataCounters = document.querySelector("#dataCounters");
const listTree = document.querySelector("#listTree");
const listToolbar = document.querySelector("#listToolbar");
const listSummary = document.querySelector("#listSummary");
const resultPanel = document.querySelector("#resultPanel");
const resultMessage = document.querySelector("#resultMessage");
const metrics = document.querySelector("#metrics");
const tasksSummary = document.querySelector("#tasksSummary");
const tasksTableBody = document.querySelector("#tasksTableBody");
const googleDrivePanel = document.querySelector("#googleDrivePanel");
const googleDriveWorkspaceLabel = document.querySelector("#googleDriveWorkspaceLabel");
const googleDriveAuthUrlButton = document.querySelector("#googleDriveAuthUrlButton");
const googleDriveAuthLink = document.querySelector("#googleDriveAuthLink");
const googleDriveExchangeButton = document.querySelector("#googleDriveExchangeButton");
const googleDriveImportButton = document.querySelector("#googleDriveImportButton");
const googleDriveReconcileButton = document.querySelector("#googleDriveReconcileButton");
const refreshDriveFilesButton = document.querySelector("#refreshDriveFilesButton");
const googleDriveFilesSummary = document.querySelector("#googleDriveFilesSummary");
const googleDriveFilesBody = document.querySelector("#googleDriveFilesBody");

const fields = {
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  registerName: document.querySelector("#registerName"),
  registerEmail: document.querySelector("#registerEmail"),
  registerPassword: document.querySelector("#registerPassword"),
  workspaceName: document.querySelector("#workspaceName"),
  active: document.querySelector("#active"),
  token: document.querySelector("#token"),
  importMode: document.querySelector("#importMode"),
  googleDriveActive: document.querySelector("#googleDriveActive"),
  googleDriveRedirectUri: document.querySelector("#googleDriveRedirectUri"),
  googleDriveFolderIds: document.querySelector("#googleDriveFolderIds"),
  googleDriveCode: document.querySelector("#googleDriveCode"),
  googleDriveImportMode: document.querySelector("#googleDriveImportMode")
};

function normalizedPath(pathname = window.location.pathname) {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

function isSignedIn() {
  return Boolean(state.ownerToken);
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${state.ownerToken}`
  };
}

function updateChrome() {
  privateControls.forEach((element) => {
    element.hidden = !isSignedIn();
  });
  publicControls.forEach((element) => {
    element.hidden = isSignedIn();
  });
}

function navigate(path, { replace = false } = {}) {
  const nextPath = normalizedPath(path);
  if (replace) {
    window.history.replaceState({}, "", nextPath);
  } else {
    window.history.pushState({}, "", nextPath);
  }
  renderRoute();
}

function renderRoute() {
  updateChrome();

  let path = normalizedPath();
  if (!publicRoutes.has(path) && !privateRoutes.has(path)) {
    path = isSignedIn() ? "/dashboard" : "/";
    window.history.replaceState({}, "", path);
  }

  if (privateRoutes.has(path) && !isSignedIn()) {
    window.history.replaceState({}, "", "/auth/login");
    path = "/auth/login";
    showResult("Sign in to continue.", "error");
  }

  if ((path === "/auth/login" || path === "/auth/register") && isSignedIn()) {
    window.history.replaceState({}, "", "/dashboard");
    path = "/dashboard";
  }

  views.forEach((view) => {
    view.hidden = view.dataset.view !== path;
  });

  document.body.dataset.route = path;
  renderConnectionState();
  setClickUpEnabled(isSignedIn());
  setGoogleDriveEnabled(isSignedIn());
}

function setBusy(isBusy) {
  document.querySelectorAll("button, input, select").forEach((control) => {
    control.disabled = isBusy;
  });
  links.forEach((link) => {
    link.setAttribute("aria-disabled", String(isBusy));
  });
  setClickUpEnabled(isSignedIn() && !isBusy);
  setGoogleDriveEnabled(isSignedIn() && !isBusy);
  refreshTasksButton.disabled = !isSignedIn() || isBusy;
  refreshDriveFilesButton.disabled = !isSignedIn() || isBusy;
}

function setClickUpEnabled(isEnabled) {
  clickupPanel.querySelectorAll("input, button, select").forEach((control) => {
    control.disabled = !isEnabled;
  });
  workspaceSelect.disabled = !isEnabled || state.clickup.workspaces.length === 0;
  loadListsButton.disabled = !isEnabled || !workspaceSelect.value;
  refreshButton.disabled = !isEnabled || !state.clickup.configured;
  const loadedListCount = allLists().length;
  selectAllListsButton.disabled = !isEnabled || loadedListCount === 0;
  clearListsButton.disabled = !isEnabled || state.clickup.selectedListIds.size === 0;
  const canSave = isEnabled && state.clickup.selectedListIds.size > 0 && Boolean(workspaceSelect.value);
  saveButton.disabled = !canSave;
  syncButton.disabled = !canSave;
}

function setGoogleDriveEnabled(isEnabled) {
  googleDrivePanel.querySelectorAll("input, button, select").forEach((control) => {
    control.disabled = !isEnabled;
  });
  fields.googleDriveRedirectUri.disabled = true;
  googleDriveAuthLink.hidden = !googleDriveAuthLink.href || googleDriveAuthLink.getAttribute("href") === "#";
  googleDriveImportButton.disabled = !isEnabled || !state.googleDrive.configured;
  googleDriveReconcileButton.disabled = !isEnabled || !state.googleDrive.configured;
  refreshDriveFilesButton.disabled = !isEnabled;
}

function showResult(message, tone = "success", sync = null) {
  resultPanel.hidden = false;
  resultMessage.textContent = message;
  resultMessage.className = tone === "error" ? "is-error" : "is-success";
  metrics.innerHTML = "";

  if (!sync) {
    return;
  }

  const items = [
    ["Items", sync.itemCount],
    ["Created", sync.createdCount],
    ["Updated", sync.updatedCount],
    ["Skipped", sync.skippedCount],
    ["Deleted", sync.deletedCount],
    ["Would create", sync.wouldCreateCount],
    ["Would update", sync.wouldUpdateCount]
  ];

  for (const [label, value] of items) {
    const item = document.createElement("div");
    item.innerHTML = `<dt>${label}</dt><dd>${value ?? 0}</dd>`;
    metrics.append(item);
  }
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseIdList(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function areaDefinitionFor(area) {
  return COMPANY_AREAS.find((item) => item.key === area?.key)
    || COMPANY_AREAS.find((item) => item.number === String(area?.position).padStart(2, "0"))
    || { number: String(area?.position || 0).padStart(2, "0"), label: area?.name || "Area", key: area?.key, description: area?.description || "" };
}

function areaLabel(area) {
  const definition = areaDefinitionFor(area);
  return `${definition.number}. ${definition.label}`;
}

function selectedArea() {
  return state.operatingModel.areas.find((area) => area.key === state.selectedAreaKey)
    || state.operatingModel.areas[0]
    || null;
}

function recordsForTable(table) {
  return state.databaseTables.get(table.apiSlug)?.records || [];
}

function countForTable(table) {
  return recordsForTable(table).length;
}

function providerLabel(provider) {
  if (provider === "google_drive") {
    return "Google Drive";
  }
  if (provider === "clickup") {
    return "ClickUp";
  }
  return provider || "CompanyCore";
}

function renderTasks() {
  tasksTableBody.innerHTML = "";
  const tasks = state.tasks;

  if (tasks.length === 0) {
    tasksSummary.textContent = "No tasks found in this workspace yet.";
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6">No tasks found yet.</td>';
    tasksTableBody.append(row);
    return;
  }

  const clickUpCount = tasks.filter((task) => task.source === "clickup").length;
  tasksSummary.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"} loaded, including ${clickUpCount} from ClickUp.`;

  for (const task of tasks.slice(0, 50)) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.title}</td>
      <td>${task.status}</td>
      <td>${task.priority || "-"}</td>
      <td>${task.taskList?.name || "-"}</td>
      <td>${task.source || "companycore"}</td>
      <td>${formatDate(task.dueDate)}</td>
    `;
    tasksTableBody.append(row);
  }
}

function renderDataCounters() {
  dataCounters.innerHTML = "";
  const counters = [
    ["Areas", state.operatingModel.areas.length],
    ["Tables", state.operatingModel.areas.flatMap((area) => area.tables || []).length],
    ["Records", [...state.databaseTables.values()].reduce((sum, item) => sum + item.records.length, 0)],
    ["Drive files", state.googleDrive.files.length],
    ["Mappings", state.operatingModel.externalMappings.length],
    ["Automations", state.operatingModel.automationDefinitions.length]
  ];

  for (const [label, value] of counters) {
    const card = document.createElement("article");
    card.className = "panel summary-card mini-card";
    card.innerHTML = `
      <span class="summary-kicker">${escapeHtml(label)}</span>
      <strong>${value}</strong>
    `;
    dataCounters.append(card);
  }
}

function renderOperatingMap() {
  operatingAreasNav.innerHTML = "";
  const areas = [...state.operatingModel.areas].sort((left, right) => (
    (COMPANY_AREA_ORDER.get(left.key) ?? left.position ?? 99)
    - (COMPANY_AREA_ORDER.get(right.key) ?? right.position ?? 99)
  ));

  if (areas.length === 0) {
    areaTitle.textContent = "No operating model loaded";
    areaDescription.textContent = isSignedIn()
      ? "Refresh the workspace connection to load CompanyCore areas."
      : "Sign in to load the company operating model.";
    areaStats.innerHTML = "";
    areaTables.innerHTML = "";
    areaFiles.innerHTML = "";
    areaMappings.innerHTML = "";
    areaRecords.innerHTML = "";
    renderDataCounters();
    return;
  }

  if (!state.selectedAreaKey || !areas.some((area) => area.key === state.selectedAreaKey)) {
    state.selectedAreaKey = areas[0].key;
  }

  for (const area of areas) {
    const button = document.createElement("button");
    const definition = areaDefinitionFor(area);
    button.type = "button";
    button.className = `area-button${area.key === state.selectedAreaKey ? " is-active" : ""}`;
    button.innerHTML = `
      <span class="folder-icon" aria-hidden="true"></span>
      <span>${escapeHtml(definition.number)}. ${escapeHtml(definition.label)}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedAreaKey = area.key;
      renderOperatingMap();
    });
    operatingAreasNav.append(button);
  }

  const area = selectedArea();
  const definition = areaDefinitionFor(area);
  const tables = area.tables || [];
  const tableIds = new Set(tables.map((table) => table.id));
  const files = state.googleDrive.files.filter((file) => (
    file.operatingAreaId === area.id
    || file.operatingTableId && tableIds.has(file.operatingTableId)
    || definition.key === "assets-storage" && !file.operatingAreaId
  ));
  const mappings = state.operatingModel.externalMappings.filter((mapping) => (
    mapping.areaId === area.id
    || mapping.tableId && tableIds.has(mapping.tableId)
  ));
  const recordCount = tables.reduce((sum, table) => sum + countForTable(table), 0);

  areaTitle.textContent = `${definition.number}. ${definition.label}`;
  areaDescription.textContent = definition.description || area.description || area.name;
  areaStats.innerHTML = `
    <span>${tables.length} tables</span>
    <span>${recordCount} records</span>
    <span>${files.length} Drive files</span>
  `;

  renderCompactList(areaTables, tables, (table) => `
    <strong>${escapeHtml(table.name)}</strong>
    <span>${escapeHtml(table.tableName)} · /v1/${escapeHtml(table.apiSlug)} · ${countForTable(table)} records</span>
  `, "No CompanyCore tables mapped to this area yet.");

  renderCompactList(areaFiles, files.slice(0, 8), (file) => `
    <strong>${escapeHtml(file.name)}</strong>
    <span>${file.isFolder ? "Folder" : escapeHtml(file.mimeType)} · ${escapeHtml(file.scanStatus)} · ${formatDate(file.modifiedTime)}</span>
  `, state.googleDrive.configured ? "No imported Drive files mapped here yet." : "Google Drive is not connected yet.");

  renderCompactList(areaMappings, mappings.slice(0, 8), (mapping) => `
    <strong>${escapeHtml(mapping.name || mapping.externalId)}</strong>
    <span>${escapeHtml(providerLabel(mapping.provider))} · ${escapeHtml(mapping.entityType)}</span>
  `, "No external provider mappings in this area yet.");

  const previews = tables.flatMap((table) => recordsForTable(table).slice(0, 3).map((record) => ({ table, record }))).slice(0, 10);
  renderCompactList(areaRecords, previews, ({ table, record }) => `
    <strong>${escapeHtml(record.title || record.name || record.summary || record.email || record.id)}</strong>
    <span>${escapeHtml(table.name)} · ${escapeHtml(record.status || record.source || "companycore")}</span>
  `, "No records in this area's mapped tables yet.");

  renderDataCounters();
}

function renderCompactList(container, items, renderItem, emptyText) {
  container.innerHTML = "";
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = emptyText;
    container.append(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "compact-row";
    row.innerHTML = renderItem(item);
    container.append(row);
  }
}

function renderGoogleDriveFiles() {
  googleDriveFilesBody.innerHTML = "";
  const files = state.googleDrive.files;

  if (files.length === 0) {
    googleDriveFilesSummary.textContent = state.googleDrive.configured
      ? "No Drive files imported yet."
      : "Google Drive is not connected yet.";
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="5">No Drive files loaded yet.</td>';
    googleDriveFilesBody.append(row);
    return;
  }

  const folderCount = files.filter((file) => file.isFolder).length;
  googleDriveFilesSummary.textContent = `${files.length} Drive item${files.length === 1 ? "" : "s"} loaded, including ${folderCount} folder${folderCount === 1 ? "" : "s"}.`;
  const areasById = new Map(state.operatingModel.areas.map((area) => [area.id, area]));

  for (const file of files.slice(0, 80)) {
    const row = document.createElement("tr");
    const area = areasById.get(file.operatingAreaId);
    row.innerHTML = `
      <td>${escapeHtml(file.name)}</td>
      <td>${file.isFolder ? "Folder" : escapeHtml(file.mimeType)}</td>
      <td>${area ? escapeHtml(areaLabel(area)) : "-"}</td>
      <td>${escapeHtml(file.scanStatus)}</td>
      <td>${formatDate(file.modifiedTime)}</td>
    `;
    googleDriveFilesBody.append(row);
  }
}

async function loadTasks() {
  if (!isSignedIn()) {
    state.tasks = [];
    renderTasks();
    return;
  }

  const response = await api("/v1/tasks");
  state.tasks = response.data || [];
  state.databaseTables.set("tasks", { records: state.tasks });
  renderTasks();
  renderOperatingMap();
}

async function loadOperatingModel() {
  if (!isSignedIn()) {
    state.operatingModel = {
      areas: [],
      externalMappings: [],
      externalFields: [],
      storageLocations: [],
      knowledgeRoots: [],
      automationDefinitions: []
    };
    state.databaseTables = new Map();
    renderOperatingMap();
    return;
  }

  const response = await api("/v1/operating-model");
  state.operatingModel = response.data || state.operatingModel;
  await loadDatabaseSnapshot();
  renderOperatingMap();
}

async function loadDatabaseSnapshot() {
  const tables = state.operatingModel.areas.flatMap((area) => area.tables || []);
  const next = new Map(state.databaseTables);

  await Promise.all(tables.map(async (table) => {
    try {
      const response = await api(`/v1/${table.apiSlug}`);
      next.set(table.apiSlug, { records: response.data || [] });
    } catch {
      next.set(table.apiSlug, { records: [] });
    }
  }));

  state.databaseTables = next;
}

async function loadGoogleDriveFiles() {
  if (!isSignedIn()) {
    state.googleDrive.files = [];
    renderGoogleDriveFiles();
    renderOperatingMap();
    return;
  }

  const response = await api("/v1/google-drive/files");
  state.googleDrive.files = response.data || [];
  renderGoogleDriveFiles();
  renderOperatingMap();
}

function friendlyError(error) {
  const message = error?.message || "Something went wrong.";
  const copy = {
    email_already_registered: "This email already has a CompanyCore account.",
    invalid_credentials: "Email or password is incorrect.",
    integration_invalid_token: "ClickUp rejected this token. Check that it belongs to your ClickUp account and has access to the Workspace.",
    integration_rate_limited: "ClickUp rate limit was reached. Wait a minute, then try again.",
    integration_secret_required: "Paste a ClickUp token first, or use a saved connection.",
    integration_not_configured: "ClickUp is not configured for this workspace yet.",
    integration_unavailable: "ClickUp did not respond successfully. Try again shortly.",
    google_drive_not_configured: "Google Drive is not configured for this workspace yet.",
    google_drive_oauth_required: "Google Drive needs an OAuth refresh token before it can import files.",
    validation_error: "Some fields are missing or invalid.",
    forbidden: "This action requires the owner login."
  };
  return copy[message] || message;
}

function parseApiError(body, fallback) {
  if (typeof body?.error === "string") {
    return body.error;
  }
  return body?.error?.message || body?.error?.code || fallback;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseApiError(body, `${response.status} ${response.statusText}`));
  }
  return body;
}

async function authRequest(path, payload) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(parseApiError(body, "Auth failed."));
  }
  return body;
}

function applyAuthPayload(payload) {
  state.ownerToken = payload.data.token;
  state.user = payload.data.user;
  state.workspace = payload.data.workspace;
  sessionStorage.setItem("companycoreOwnerToken", state.ownerToken);
}

function renderConnectionState() {
  const connected = isSignedIn() && state.workspace;
  connectionStatus.innerHTML = connected
    ? '<span class="dot ok"></span><span>Connected</span>'
    : '<span class="dot muted"></span><span>Not connected</span>';

  workspaceLabel.textContent = connected
    ? `${state.workspace.name} workspace`
    : "Sign in to load workspace status.";
  clickupWorkspaceLabel.textContent = connected
    ? `${state.workspace.name} workspace`
    : "Sign in to load workspace settings.";
  workspaceNameLabel.textContent = connected ? state.workspace.name : "-";

  if (state.clickup.configured) {
    clickupStatusLabel.textContent = state.clickup.active ? "Active" : "Saved, inactive";
    clickupStatusHint.textContent = `${(state.clickup.config.listIds || []).length} ClickUp Lists selected.`;
  } else {
    clickupStatusLabel.textContent = "Not configured";
    clickupStatusHint.textContent = "Connect ClickUp in settings.";
  }

  if (state.googleDrive.configured) {
    googleDriveStatusLabel.textContent = state.googleDrive.active ? "Active" : "Saved, inactive";
    googleDriveStatusHint.textContent = `${state.googleDrive.files.length} Drive item${state.googleDrive.files.length === 1 ? "" : "s"} imported.`;
    googleDriveWorkspaceLabel.textContent = connected
      ? `${state.workspace.name} workspace · Google Drive ${state.googleDrive.active ? "active" : "inactive"}`
      : "Sign in to load Google Drive settings.";
  } else {
    googleDriveStatusLabel.textContent = "Not configured";
    googleDriveStatusHint.textContent = "Connect Google Drive to import folders and files.";
    googleDriveWorkspaceLabel.textContent = connected
      ? `${state.workspace.name} workspace · Google Drive not configured`
      : "Sign in to load Google Drive settings.";
  }

  if (state.capabilities.length > 0) {
    capabilitySummary.textContent = `${state.capabilities.length} capabilities available for this workspace.`;
    capabilityList.innerHTML = "";
    for (const capability of state.capabilities) {
      const item = document.createElement("span");
      item.textContent = capability;
      capabilityList.append(item);
    }
  } else {
    capabilitySummary.textContent = connected
      ? "No capabilities returned by the connection endpoint."
      : "Sign in to load available API capabilities.";
    capabilityList.innerHTML = "";
  }
}

function setConnected(connection) {
  state.workspace = connection.data.workspace;
  state.capabilities = connection.data.capabilities || [];
  state.clickup.configured = connection.data.integrations.clickup.configured;
  state.clickup.active = Boolean(connection.data.integrations.clickup.active);
  state.clickup.config = connection.data.integrations.clickup.config || {};
  state.googleDrive.configured = connection.data.integrations.googleDrive.configured;
  state.googleDrive.active = Boolean(connection.data.integrations.googleDrive.active);
  state.googleDrive.config = connection.data.integrations.googleDrive.config || {};
  fields.active.checked = connection.data.integrations.clickup.active ?? !state.clickup.configured;
  fields.importMode.value = state.clickup.config.importMode || "merge";
  fields.googleDriveActive.checked = connection.data.integrations.googleDrive.active ?? !state.googleDrive.configured;
  fields.googleDriveImportMode.value = state.googleDrive.config.importMode || "merge";
  fields.googleDriveFolderIds.value = (state.googleDrive.config.selectedFolderIds || state.googleDrive.config.rootFolderIds || []).join(", ");
  fields.googleDriveRedirectUri.value = `${window.location.origin}/settings/drive`;
  state.clickup.selectedListIds = new Set(state.clickup.config.listIds || []);
  state.operatingModel.areas = connection.data.operatingModel.areas || [];

  if (state.clickup.configured) {
    showResult("ClickUp settings are saved. Open Settings to refresh the saved structure.");
  }

  renderConnectionState();
  renderGoogleDriveFiles();
  renderOperatingMap();
  renderTree();
  setClickUpEnabled(true);
  setGoogleDriveEnabled(true);
}

async function loadConnection() {
  const connection = await api("/v1/connection");
  setConnected(connection);
  await Promise.all([
    loadOperatingModel(),
    loadGoogleDriveFiles(),
    loadTasks()
  ]);
}

function renderWorkspaces(workspaces, selectedId = "") {
  state.clickup.workspaces = workspaces;
  workspaceSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = workspaces.length > 0 ? "Choose a ClickUp Workspace" : "No Workspaces found";
  workspaceSelect.append(placeholder);

  for (const workspace of workspaces) {
    const option = document.createElement("option");
    option.value = workspace.id;
    option.textContent = workspace.name;
    workspaceSelect.append(option);
  }

  const nextSelectedId = selectedId || state.clickup.config.teamId || "";
  if (nextSelectedId && workspaces.some((workspace) => workspace.id === nextSelectedId)) {
    workspaceSelect.value = nextSelectedId;
  }

  setClickUpEnabled(isSignedIn());
}

async function discoverClickUp({ includeStructure = false, useStoredToken = false } = {}) {
  const token = fields.token.value.trim();
  const teamId = includeStructure ? workspaceSelect.value : undefined;

  if (!token && !useStoredToken) {
    throw new Error("integration_secret_required");
  }

  const response = await api("/v1/integration-settings/clickup/discover", {
    method: "POST",
    body: JSON.stringify({
      token: token || undefined,
      teamId: teamId || undefined,
      useStoredToken
    })
  });

  renderWorkspaces(response.data.workspaces || [], response.data.selectedWorkspace?.id || teamId || "");

  if (includeStructure) {
    state.clickup.selectedWorkspace = response.data.selectedWorkspace;
    state.clickup.spaces = response.data.spaces || [];
    renderTree();
  }

  return response.data;
}

function allLists() {
  const lists = [];

  for (const space of state.clickup.spaces) {
    for (const list of space.lists || []) {
      lists.push({ ...list, spaceId: space.id, spaceName: space.name, folderId: null, folderName: null });
    }
    for (const folder of space.folders || []) {
      for (const list of folder.lists || []) {
        lists.push({ ...list, spaceId: space.id, spaceName: space.name, folderId: folder.id, folderName: folder.name });
      }
    }
  }

  return lists;
}

function renderTree() {
  listTree.innerHTML = "";
  const spaces = state.clickup.spaces;
  const loadedLists = allLists();
  listToolbar.hidden = loadedLists.length === 0;

  if (spaces.length === 0) {
    listSummary.textContent = state.clickup.configured
      ? "Refresh the saved structure to review ClickUp Lists."
      : "Choose a ClickUp Workspace to load Lists.";
    setClickUpEnabled(isSignedIn());
    return;
  }

  if (loadedLists.length === 0) {
    listSummary.textContent = "This ClickUp Workspace loaded, but no Lists were returned for the token. Check whether the selected Workspace has Spaces/Lists available to this user.";
  }

  for (const space of spaces) {
    const section = document.createElement("section");
    section.className = "tree-section";

    const heading = document.createElement("h4");
    heading.textContent = space.name;
    section.append(heading);

    appendListGroup(section, "Folderless Lists", space.lists || []);

    for (const folder of space.folders || []) {
      appendListGroup(section, folder.name, folder.lists || []);
    }

    listTree.append(section);
  }

  if (loadedLists.length > 0) {
    updateListSummary();
  }
  setClickUpEnabled(isSignedIn());
}

function appendListGroup(parent, title, lists) {
  if (lists.length === 0) {
    return;
  }

  const group = document.createElement("div");
  group.className = "tree-group";
  const heading = document.createElement("p");
  heading.textContent = title;
  group.append(heading);

  for (const list of lists) {
    const item = document.createElement("label");
    item.className = "check-row";
    item.innerHTML = `
      <input type="checkbox" value="${list.id}">
      <span>${list.name}</span>
    `;
    const checkbox = item.querySelector("input");
    checkbox.checked = state.clickup.selectedListIds.has(list.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.clickup.selectedListIds.add(list.id);
      } else {
        state.clickup.selectedListIds.delete(list.id);
      }
      updateListSummary();
      setClickUpEnabled(isSignedIn());
    });
    group.append(item);
  }

  parent.append(group);
}

function updateListSummary() {
  const count = state.clickup.selectedListIds.size;
  const loadedCount = allLists().length;
  listToolbar.hidden = loadedCount === 0;

  if (loadedCount === 0) {
    listSummary.textContent = "No ClickUp Lists loaded yet.";
    return;
  }

  listSummary.textContent = count === 0
    ? `${loadedCount} List${loadedCount === 1 ? "" : "s"} loaded. Select at least one List to sync.`
    : `${count} of ${loadedCount} List${loadedCount === 1 ? "" : "s"} selected for sync.`;
}

function selectAllLoadedLists() {
  for (const list of allLists()) {
    state.clickup.selectedListIds.add(list.id);
  }
  renderTree();
}

function clearSelectedLists() {
  state.clickup.selectedListIds.clear();
  renderTree();
}

async function loadSelectedWorkspaceLists() {
  if (!workspaceSelect.value) {
    throw new Error("Choose a ClickUp Workspace first.");
  }

  await discoverClickUp({
    includeStructure: true,
    useStoredToken: !fields.token.value.trim()
  });
}

function selectedConfig() {
  const selectedLists = allLists().filter((list) => state.clickup.selectedListIds.has(list.id));
  return {
    teamId: workspaceSelect.value,
    spaceIds: [...new Set(selectedLists.map((list) => list.spaceId))],
    folderIds: [...new Set(selectedLists.map((list) => list.folderId).filter(Boolean))],
    listIds: selectedLists.map((list) => list.id),
    syncMode: "pull",
    importMode: fields.importMode.value || "merge"
  };
}

async function saveSettings({ forceActive = false } = {}) {
  const config = selectedConfig();
  if (!config.teamId || config.listIds.length === 0) {
    throw new Error("Select a ClickUp Workspace and at least one List.");
  }

  if (forceActive) {
    fields.active.checked = true;
  }

  const payload = {
    config,
    active: forceActive ? true : fields.active.checked
  };

  const rawToken = fields.token.value.trim();
  if (rawToken) {
    payload.token = rawToken;
  }

  await api("/v1/integration-settings/clickup", {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  fields.token.value = "";
  state.clickup.configured = true;
  state.clickup.active = payload.active;
  state.clickup.config = config;
}

links.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) {
      return;
    }
    event.preventDefault();
    navigate(url.pathname);
  });
});

window.addEventListener("popstate", renderRoute);

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("companycoreOwnerToken");
  state.ownerToken = "";
  state.workspace = null;
  state.user = null;
  state.capabilities = [];
  state.clickup.configured = false;
  state.clickup.active = false;
  state.clickup.config = {};
  state.clickup.workspaces = [];
  state.clickup.spaces = [];
  state.clickup.selectedListIds = new Set();
  state.googleDrive.configured = false;
  state.googleDrive.active = false;
  state.googleDrive.config = {};
  state.googleDrive.files = [];
  state.operatingModel = {
    areas: [],
    externalMappings: [],
    externalFields: [],
    storageLocations: [],
    knowledgeRoots: [],
    automationDefinitions: []
  };
  state.databaseTables = new Map();
  state.selectedAreaKey = "";
  state.tasks = [];
  renderTasks();
  renderGoogleDriveFiles();
  renderOperatingMap();
  resultPanel.hidden = true;
  navigate("/auth/login", { replace: true });
});

refreshTasksButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await loadTasks();
    showResult("Tasks refreshed.");
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(true);

  try {
    const response = await authRequest("/auth/login", {
      email: fields.email.value,
      password: fields.password.value
    });

    applyAuthPayload(response);
    await loadConnection();
    showResult("Signed in. Open Settings to connect ClickUp.");
    navigate("/dashboard", { replace: true });
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(true);

  try {
    const response = await authRequest("/auth/register", {
      email: fields.registerEmail.value,
      password: fields.registerPassword.value,
      name: fields.registerName.value || undefined,
      workspaceName: fields.workspaceName.value
    });

    applyAuthPayload(response);
    await loadConnection();
    showResult("Workspace created. Open Settings to connect ClickUp.");
    navigate("/dashboard", { replace: true });
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

checkTokenButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await discoverClickUp();
    showResult("Token checked. Choose the ClickUp Workspace to connect.");
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

loadListsButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await loadSelectedWorkspaceLists();
    const count = allLists().length;
    showResult(count > 0
      ? `Workspace loaded. ${count} ClickUp List${count === 1 ? "" : "s"} available.`
      : "Workspace loaded, but ClickUp returned no Lists for this token.", count > 0 ? "success" : "error");
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

selectAllListsButton.addEventListener("click", () => {
  selectAllLoadedLists();
});

clearListsButton.addEventListener("click", () => {
  clearSelectedLists();
});

fields.active.addEventListener("change", () => {
  setClickUpEnabled(isSignedIn());
});

refreshButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await discoverClickUp({ useStoredToken: true });
    showResult("Saved ClickUp token checked. Choose a Workspace to refresh Lists.");
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

workspaceSelect.addEventListener("change", async () => {
  if (!workspaceSelect.value) {
    state.clickup.spaces = [];
    renderTree();
    return;
  }

  state.clickup.spaces = [];
  state.clickup.selectedListIds = new Set();
  renderTree();
  showResult("Workspace selected. Click Load Lists to fetch ClickUp Lists.");
});

saveButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await saveSettings();
    await loadConnection();
    showResult("ClickUp connection saved.");
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

syncButton.addEventListener("click", async () => {
  setBusy(true);

  try {
    await saveSettings({ forceActive: true });
    const sync = await api("/v1/tasks/sync/clickup/native", {
      method: "POST",
      body: JSON.stringify({
        importMode: fields.importMode.value || "merge"
      })
    });
    await loadConnection();
    await loadTasks();
    showResult("ClickUp connection saved and sync completed.", "success", sync.data);
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

fields.googleDriveActive.addEventListener("change", () => {
  setGoogleDriveEnabled(isSignedIn());
});

googleDriveAuthUrlButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    const response = await api("/v1/integration-settings/google_drive/oauth/authorize-url", {
      method: "POST",
      body: JSON.stringify({
        redirectUri: fields.googleDriveRedirectUri.value,
        state: state.workspace?.id || "companycore"
      })
    });
    googleDriveAuthLink.href = response.data.authorizationUrl;
    googleDriveAuthLink.hidden = false;
    showResult("Google Drive OAuth URL created. Open Google consent, then paste the authorization code here.");
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

googleDriveExchangeButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    const code = fields.googleDriveCode.value.trim();
    if (!code) {
      throw new Error("Paste the Google authorization code first.");
    }
    const folderIds = parseIdList(fields.googleDriveFolderIds.value);
    await api("/v1/integration-settings/google_drive/oauth/exchange", {
      method: "POST",
      body: JSON.stringify({
        code,
        redirectUri: fields.googleDriveRedirectUri.value,
        active: fields.googleDriveActive.checked,
        config: {
          selectedFolderIds: folderIds,
          rootFolderIds: folderIds,
          importMode: fields.googleDriveImportMode.value || "merge",
          syncMode: "two_way"
        }
      })
    });
    fields.googleDriveCode.value = "";
    await loadConnection();
    showResult("Google Drive OAuth connection saved. Import folders to fill CompanyCore with Drive metadata.");
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

googleDriveImportButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    const folderIds = parseIdList(fields.googleDriveFolderIds.value);
    const result = await api("/v1/integration-settings/google_drive/import", {
      method: "POST",
      body: JSON.stringify({
        folderIds: folderIds.length > 0 ? folderIds : undefined,
        importMode: fields.googleDriveImportMode.value || "merge"
      })
    });
    await loadConnection();
    showResult("Google Drive import finished.", "success", result.data);
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

googleDriveReconcileButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    const result = await api("/v1/integration-settings/google_drive/changes/reconcile", {
      method: "POST",
      body: JSON.stringify({})
    });
    await loadConnection();
    showResult("Google Drive changes reconciled.", "success", result.data);
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

refreshDriveFilesButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await loadGoogleDriveFiles();
    showResult("Google Drive files refreshed.");
  } catch (error) {
    showResult(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
});

renderRoute();

if (state.ownerToken) {
  loadConnection().then(() => {
    renderRoute();
  }).catch(() => {
    sessionStorage.removeItem("companycoreOwnerToken");
    state.ownerToken = "";
    setClickUpEnabled(false);
    renderRoute();
  });
} else {
  setClickUpEnabled(false);
  setGoogleDriveEnabled(false);
  renderOperatingMap();
  renderGoogleDriveFiles();
}
