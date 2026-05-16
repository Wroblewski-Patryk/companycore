import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CcButton } from "./components/cc-button";
import { CcDataTable, type CcTableColumn } from "./components/cc-data-table";
import {
  canonicalAssetsPath,
  canonicalGeneralDashboardPath,
  canonicalOperationsPath,
  canonicalPostAuthPath,
  resolveRouteMeta
} from "./app-route-registry";
import "./styles.css";

type LoadState<T> = {
  status: "idle" | "loading" | "ready" | "error";
  data: T | null;
  error?: string;
};

type AuthPayload = {
  data?: {
    token: string;
    user: { email: string; name?: string | null };
    workspace: { name: string };
  };
  error?: string;
};

type RouteProposal = {
  id: string;
  title?: string;
  status?: string;
  targetDepartmentKey?: string;
  sourceType?: string;
  riskLevel?: string;
};

type RouteProposalPacket = {
  summary?: Record<string, number>;
  proposals?: RouteProposal[];
  blockedActions?: string[];
};

type OperationsWorkItem = {
  id: string;
  title: string;
  status?: string;
  priority?: string;
  owner?: string | null;
  readiness?: string;
  linkedResources?: number;
};

type OperationsPacket = {
  summary?: Record<string, number>;
  workItems?: OperationsWorkItem[];
  blockedActions?: string[];
  agentPacket?: { mode?: string; instructions?: string[] };
};

type AssetResource = {
  id: string;
  name: string;
  type?: string;
  status?: string;
  owner?: string | null;
  aiContextReady?: boolean;
  source?: string;
  webViewLink?: string;
};

type AssetsPacket = {
  summary?: Record<string, number>;
  resources?: AssetResource[];
  blockedActions?: string[];
  agentPacket?: { mode?: string; instructions?: string[] };
};

type CoreArea = {
  key: "00-ogolny" | "04-operacje" | "08-zasoby";
  label: string;
  eyebrow: string;
  href: string;
  description: string;
  icon: string;
};

const coreAreas: CoreArea[] = [
  {
    key: "00-ogolny",
    label: "00 General",
    eyebrow: "Company dashboard",
    href: canonicalGeneralDashboardPath,
    description: "Single starting point after login. Connects company departments, route proposals, priorities, and management signals.",
    icon: "ph-map-trifold"
  },
  {
    key: "04-operacje",
    label: "04 Operations",
    eyebrow: "Work execution",
    href: canonicalOperationsPath,
    description: "Operational task and workflow board for work items, readiness, ownership, blocked actions, and AI-safe handoff.",
    icon: "ph-list-checks"
  },
  {
    key: "08-zasoby",
    label: "08 Assets",
    eyebrow: "Knowledge and files",
    href: canonicalAssetsPath,
    description: "Resource memory for files, documents, knowledge packets, AI-readiness, relations, and provider-safe context.",
    icon: "ph-folder-open"
  }
];

const plannedDepartments = [
  "01 Strategy",
  "02 Product",
  "03 Sales",
  "05 Relationships",
  "06 People / Agents",
  "07 Finance",
  "09 Technology",
  "10 Legal",
  "11 Innovation",
  "12 Management"
];

function ownerToken() {
  return window.sessionStorage.getItem("companycoreOwnerToken");
}

function setOwnerToken(token: string) {
  window.sessionStorage.setItem("companycoreOwnerToken", token);
}

function clearOwnerToken() {
  window.sessionStorage.removeItem("companycoreOwnerToken");
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = ownerToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : "request_failed";
    if (["invalid_token", "invalid_auth_token", "missing_api_key", "invalid_api_key"].includes(message)) {
      clearOwnerToken();
    }
    throw new Error(message);
  }

  return body as T;
}

function useOwnerPacket<T>(path: string, enabled: boolean): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: enabled ? "loading" : "idle", data: null });

  useEffect(() => {
    let active = true;
    if (!enabled) {
      setState({ status: "idle", data: null });
      return () => {
        active = false;
      };
    }

    setState({ status: "loading", data: null });
    api<T>(path)
      .then((data) => {
        if (active) {
          setState({ status: "ready", data });
        }
      })
      .catch((error: Error) => {
        if (active) {
          setState({ status: "error", data: null, error: error.message });
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, path]);

  return state;
}

function currentAreaKey() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get("area");
  if (key === "04-operacje" || key === "08-zasoby" || key === "00-ogolny") {
    return key;
  }
  return "00-ogolny";
}

function isSignedIn() {
  return Boolean(ownerToken());
}

function Shell({
  children,
  activeArea
}: {
  children: React.ReactNode;
  activeArea?: CoreArea["key"];
}) {
  return (
    <main className="min-h-screen bg-base-200 text-base-content" data-theme="companycore">
      <div className="grid min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-base-300 bg-neutral p-5 text-neutral-content lg:block">
          <a className="flex items-center gap-3 no-underline text-neutral-content" href={canonicalGeneralDashboardPath}>
            <span className="grid h-10 w-10 place-items-center rounded-company bg-primary font-black">CC</span>
            <span>
              <strong className="block">CompanyCore</strong>
              <small className="text-neutral-content/65">Operating system</small>
            </span>
          </a>
          <nav className="mt-8 grid gap-2">
            {coreAreas.map((area) => (
              <a
                className={`grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-company px-3 py-3 text-sm no-underline ${activeArea === area.key ? "bg-primary text-primary-content" : "text-neutral-content/75 hover:bg-white/10 hover:text-neutral-content"}`}
                href={area.href}
                key={area.key}
              >
                <i className={`ph-bold ${area.icon} mt-1`} aria-hidden="true"></i>
                <span>
                  <strong className="block">{area.label}</strong>
                  <small>{area.eyebrow}</small>
                </span>
              </a>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a className="flex items-center gap-2 font-black no-underline text-company-ink lg:hidden" href={canonicalGeneralDashboardPath}>
                <span className="grid h-9 w-9 place-items-center rounded-company bg-neutral text-neutral-content">CC</span>
                <span>CompanyCore</span>
              </a>
              <nav className="flex flex-wrap gap-2">
                {coreAreas.map((area) => (
                  <CcButton
                    href={area.href}
                    key={area.key}
                    size="sm"
                    variant={activeArea === area.key ? "primary" : "ghost"}
                  >
                    {area.label}
                  </CcButton>
                ))}
              </nav>
              <CcButton
                onClick={() => {
                  clearOwnerToken();
                  window.location.assign("/");
                }}
                size="sm"
                variant="outline"
              >
                Sign out
              </CcButton>
            </div>
          </header>
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:px-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function PublicLayout({
  active,
  children
}: {
  active: "home" | "login" | "register";
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-base-100 text-base-content" data-theme="companycore">
      <header className="border-b border-base-300 bg-base-100 px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <a className="flex items-center gap-3 font-black no-underline text-company-ink" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-company bg-neutral text-neutral-content">CC</span>
            <span>CompanyCore</span>
          </a>
          <nav className="flex flex-wrap gap-2">
            <CcButton href="/" size="sm" variant={active === "home" ? "primary" : "ghost"}>Home</CcButton>
            <CcButton href="/auth/login" size="sm" variant={active === "login" ? "primary" : "ghost"}>Sign in</CcButton>
            <CcButton href="/auth/register" size="sm" variant={active === "register" ? "primary" : "outline"}>Create account</CcButton>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}

function PublicHomeRoute() {
  return (
    <PublicLayout active="home">
      <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl content-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)] lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase text-primary">Human-first UI. AI-first interoperability.</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-company-ink sm:text-6xl">Company operating system for autonomous work.</h1>
          <p className="mt-5 text-lg leading-8 text-company-muted">
            CompanyCore is not an AI chatbot. It is the system layer where humans use clear web views and external AI agents use API/MCP to read context, update records, and execute governed workflows.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CcButton href="/auth/login" iconRight="ph-arrow-right" variant="primary">Open owner workspace</CcButton>
            <CcButton href="/auth/register" variant="outline">Create workspace</CcButton>
          </div>
        </div>
        <div className="grid gap-3 rounded-company border border-base-300 bg-base-200 p-4">
          {coreAreas.map((area) => (
            <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-company border border-base-300 bg-base-100 p-4" key={area.key}>
              <i className={`ph-bold ${area.icon} text-2xl text-primary`} aria-hidden="true"></i>
              <div>
                <p className="text-xs font-black uppercase text-company-muted">{area.eyebrow}</p>
                <h2 className="text-lg font-black">{area.label}</h2>
                <p className="text-sm leading-6 text-company-muted">{area.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

function AuthRoute({ mode }: { mode: "login" | "register" }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = isLogin
      ? {
          email: String(form.get("email") || ""),
          password: String(form.get("password") || "")
        }
      : {
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
          name: String(form.get("name") || ""),
          workspaceName: String(form.get("workspaceName") || "")
        };

    setStatus("loading");
    setError("");
    try {
      const response = await api<AuthPayload>(isLogin ? "/v1/auth/login" : "/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!response.data?.token) {
        throw new Error(response.error || "auth_failed");
      }
      setOwnerToken(response.data.token);
      window.location.assign(canonicalPostAuthPath(window.sessionStorage.getItem("companycorePendingPrivatePath")));
    } catch (authError) {
      setStatus("error");
      setError(authError instanceof Error ? authError.message : "auth_failed");
    }
  }

  return (
    <PublicLayout active={mode}>
      <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl content-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.7fr)] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase text-primary">{isLogin ? "Owner sign in" : "Workspace bootstrap"}</p>
          <h1 className="mt-3 text-4xl font-black text-company-ink">{isLogin ? "Open 00 General after login." : "Create the first CompanyCore workspace."}</h1>
          <p className="mt-4 text-lg leading-8 text-company-muted">
            The web layer is intentionally clean: public entry, auth, `00 General`, `04 Operations`, and `08 Assets`.
          </p>
        </div>
        <form className="grid gap-4 rounded-company border border-base-300 bg-base-100 p-5 shadow-sm" onSubmit={onSubmit}>
          {!isLogin ? (
            <>
              <label className="form-control">
                <span className="label-text font-bold">Name</span>
                <input className="input input-bordered" name="name" autoComplete="name" />
              </label>
              <label className="form-control">
                <span className="label-text font-bold">Workspace name</span>
                <input className="input input-bordered" name="workspaceName" required defaultValue="LuckySparrow" />
              </label>
            </>
          ) : null}
          <label className="form-control">
            <span className="label-text font-bold">Email</span>
            <input className="input input-bordered" name="email" type="email" autoComplete="email" required />
          </label>
          <label className="form-control">
            <span className="label-text font-bold">Password</span>
            <input className="input input-bordered" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={isLogin ? 1 : 12} required />
          </label>
          {status === "error" ? <div className="alert alert-error text-sm">{error}</div> : null}
          <CcButton loading={status === "loading"} type="submit" variant="primary">
            {isLogin ? "Sign in" : "Create account"}
          </CcButton>
          <p className="text-sm text-company-muted">
            {isLogin ? "Need a workspace?" : "Already have access?"}{" "}
            <a className="font-bold text-primary" href={isLogin ? "/auth/register" : "/auth/login"}>{isLogin ? "Create one" : "Sign in"}</a>
          </p>
        </form>
      </section>
    </PublicLayout>
  );
}

function SummaryGrid({ summary }: { summary?: Record<string, number> }) {
  const entries = Object.entries(summary || {}).slice(0, 6);
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([label, value]) => (
        <article className="rounded-company border border-base-300 bg-base-100 p-4" key={label}>
          <p className="text-xs font-black uppercase text-company-muted">{label.replace(/([A-Z])/g, " $1")}</p>
          <strong className="mt-2 block text-3xl font-black">{value}</strong>
        </article>
      ))}
    </section>
  );
}

function BlockedActions({ actions }: { actions?: string[] }) {
  if (!actions?.length) {
    return null;
  }

  return (
    <section className="rounded-company border border-warning/35 bg-warning/10 p-4">
      <h2 className="text-sm font-black uppercase text-company-ink">Blocked write actions</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <span className="badge badge-warning badge-outline" key={action}>{action}</span>
        ))}
      </div>
    </section>
  );
}

function GeneralDashboard() {
  const proposals = useOwnerPacket<RouteProposalPacket>("/v1/intake/route-proposals?limit=20", true);
  const rows = proposals.data?.proposals || [];
  const columns: Array<CcTableColumn<RouteProposal>> = [
    { key: "title", header: "Proposal", cell: (row) => <strong>{row.title || row.id}</strong> },
    { key: "target", header: "Target", cell: (row) => row.targetDepartmentKey || "unassigned" },
    { key: "status", header: "Status", cell: (row) => <span className="badge badge-outline">{row.status || "review"}</span> },
    { key: "risk", header: "Risk", cell: (row) => row.riskLevel || "normal" }
  ];

  return (
    <Shell activeArea="00-ogolny">
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-primary">00 General</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">Company dashboard</h1>
        <p className="mt-3 max-w-3xl leading-7 text-company-muted">
          This is the only authenticated start screen. It connects all departments without exposing unfinished v0 workspaces, and routes attention into the two active management systems.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {coreAreas.map((area) => (
          <a className="rounded-company border border-base-300 bg-base-100 p-5 no-underline transition hover:border-primary hover:bg-primary/5" href={area.href} key={area.key}>
            <i className={`ph-bold ${area.icon} text-2xl text-primary`} aria-hidden="true"></i>
            <p className="mt-4 text-xs font-black uppercase text-company-muted">{area.eyebrow}</p>
            <h2 className="text-xl font-black text-company-ink">{area.label}</h2>
            <p className="mt-2 text-sm leading-6 text-company-muted">{area.description}</p>
          </a>
        ))}
      </section>

      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">12 department map</h2>
            <p className="mt-1 text-sm text-company-muted">Inactive departments stay visible as architecture context, but they do not open unfinished web views yet.</p>
          </div>
          <span className="badge badge-primary">00 routes active work</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {plannedDepartments.map((department) => (
            <div className="rounded-company border border-dashed border-base-300 bg-base-200/60 p-3 text-sm text-company-muted" key={department}>
              <strong className="block text-company-ink">{department}</strong>
              Planned management system
            </div>
          ))}
        </div>
      </section>

      <SummaryGrid summary={proposals.data?.summary} />
      <CcDataTable
        columns={columns}
        rows={rows}
        emptyTitle="No route proposals"
        emptyDetail="When intake or Paperclip output creates routing decisions, 00 General will show them here."
        error={proposals.status === "error" ? "Route proposal packet is unavailable." : null}
        getRowLabel={(row) => row.title || row.id}
        loading={proposals.status === "loading"}
        mobileMode="cards"
      />
      <BlockedActions actions={proposals.data?.blockedActions} />
    </Shell>
  );
}

function OperationsRoute() {
  const packet = useOwnerPacket<OperationsPacket>("/v1/operations/work-items?limit=50", true);
  const rows = packet.data?.workItems || [];
  const columns: Array<CcTableColumn<OperationsWorkItem>> = [
    { key: "title", header: "Work item", cell: (row) => <strong>{row.title}</strong> },
    { key: "status", header: "Status", cell: (row) => <span className="badge badge-outline">{row.status || "backlog"}</span> },
    { key: "priority", header: "Priority", cell: (row) => row.priority || "medium" },
    { key: "readiness", header: "Readiness", cell: (row) => row.readiness || "needs review" }
  ];

  return (
    <Shell activeArea="04-operacje">
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-primary">04 Operations</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">Operations management system</h1>
        <p className="mt-3 max-w-3xl leading-7 text-company-muted">
          Central execution view for tasks, pipeline readiness, linked resources, operational blockers, and agent-safe read packets.
        </p>
      </section>
      <SummaryGrid summary={packet.data?.summary} />
      <CcDataTable
        columns={columns}
        rows={rows}
        emptyTitle="No operational work items"
        emptyDetail="Create or import tasks through the backend/API first; this web layer keeps operations read-oriented until command contracts are approved."
        error={packet.status === "error" ? "Operations packet is unavailable." : null}
        getRowLabel={(row) => row.title}
        loading={packet.status === "loading"}
        mobileMode="cards"
      />
      <BlockedActions actions={packet.data?.blockedActions} />
    </Shell>
  );
}

function AssetsRoute() {
  const packet = useOwnerPacket<AssetsPacket>("/v1/assets/context?limit=50", true);
  const rows = packet.data?.resources || [];
  const columns: Array<CcTableColumn<AssetResource>> = [
    { key: "name", header: "Resource", cell: (row) => <strong>{row.name}</strong> },
    { key: "type", header: "Type", cell: (row) => row.type || "resource" },
    { key: "status", header: "Status", cell: (row) => <span className="badge badge-outline">{row.status || "indexed"}</span> },
    { key: "ai", header: "AI ready", cell: (row) => row.aiContextReady ? "ready" : "needs context" }
  ];

  return (
    <Shell activeArea="08-zasoby">
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-primary">08 Assets</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">Assets and knowledge system</h1>
        <p className="mt-3 max-w-3xl leading-7 text-company-muted">
          Company memory for resources, Drive files, documents, prompts, architecture notes, relation context, and AI-compatible read packets.
        </p>
      </section>
      <SummaryGrid summary={packet.data?.summary} />
      <CcDataTable
        columns={columns}
        rows={rows}
        emptyTitle="No assets in this packet"
        emptyDetail="Connect or import resources through backend integrations; the UI only shows source-backed assets."
        error={packet.status === "error" ? "Assets packet is unavailable." : null}
        getRowLabel={(row) => row.name}
        loading={packet.status === "loading"}
        mobileMode="cards"
        rowActions={(row) => row.webViewLink ? (
          <CcButton href={row.webViewLink} size="xs" target="_blank" rel="noreferrer" variant="ghost">Open</CcButton>
        ) : null}
      />
      <BlockedActions actions={packet.data?.blockedActions} />
    </Shell>
  );
}

function RemovedWebViewRoute() {
  useEffect(() => {
    if (!isSignedIn()) {
      window.sessionStorage.setItem("companycorePendingPrivatePath", window.location.pathname + window.location.search);
    }
  }, []);

  if (!isSignedIn()) {
    return <AuthRoute mode="login" />;
  }

  return (
    <Shell activeArea="00-ogolny">
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-warning">Archived web view</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">This old v0 screen is no longer active.</h1>
        <p className="mt-3 max-w-3xl leading-7 text-company-muted">
          The backend remains available, but the web layer has been cleaned to prevent unfinished screens from mixing with the current operating system UX.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <CcButton href={canonicalGeneralDashboardPath} variant="primary">Open 00 General</CcButton>
          <CcButton href={canonicalOperationsPath} variant="outline">Open 04 Operations</CcButton>
          <CcButton href={canonicalAssetsPath} variant="outline">Open 08 Assets</CcButton>
        </div>
      </section>
    </Shell>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const routeKey = window.location.pathname + window.location.search;
  if (!isSignedIn()) {
    window.sessionStorage.setItem("companycorePendingPrivatePath", routeKey);
    return <AuthRoute mode="login" />;
  }
  return <>{children}</>;
}

function App() {
  const pathname = window.location.pathname;
  const route = useMemo(() => resolveRouteMeta(pathname + window.location.search), [pathname]);

  if (pathname === "/") {
    return <PublicHomeRoute />;
  }

  if (pathname === "/auth/login") {
    return <AuthRoute mode="login" />;
  }

  if (pathname === "/auth/register") {
    return <AuthRoute mode="register" />;
  }

  if (pathname === "/dashboard" || pathname === "/react-dashboard" || (pathname === "/areas" && currentAreaKey() === "00-ogolny")) {
    if (pathname !== "/areas" || window.location.search !== "?area=00-ogolny&view=overview") {
      window.history.replaceState(null, "", canonicalGeneralDashboardPath);
    }
    return <PrivateRoute><GeneralDashboard /></PrivateRoute>;
  }

  if (pathname === "/operations" || (pathname === "/areas" && currentAreaKey() === "04-operacje")) {
    if (pathname !== "/areas") {
      window.history.replaceState(null, "", canonicalOperationsPath);
    }
    return <PrivateRoute><OperationsRoute /></PrivateRoute>;
  }

  if (pathname === "/areas" && currentAreaKey() === "08-zasoby") {
    return <PrivateRoute><AssetsRoute /></PrivateRoute>;
  }

  if (route?.private) {
    return <PrivateRoute><GeneralDashboard /></PrivateRoute>;
  }

  return <RemovedWebViewRoute />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
