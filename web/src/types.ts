export type LoadState<T> = {
  status: "idle" | "loading" | "ready" | "error";
  data: T | null;
  error?: string;
};

export type AuthPayload = {
  data?: {
    token: string;
    user: { email: string; name?: string | null };
    workspace: { name: string };
  };
  error?: string;
};

export type RouteProposal = {
  id: string;
  title?: string;
  status?: string;
  targetDepartmentKey?: string;
  sourceType?: string;
  riskLevel?: string;
};

export type RouteProposalPacket = {
  summary?: Record<string, number>;
  proposals?: RouteProposal[];
  blockedActions?: string[];
};

export type OperationsWorkItem = {
  id: string;
  title: string;
  status?: string;
  priority?: string;
  owner?: string | null;
  readiness?: string;
  linkedResources?: number;
};

export type OperationsPacket = {
  summary?: Record<string, number>;
  workItems?: OperationsWorkItem[];
  blockedActions?: string[];
  agentPacket?: { mode?: string; instructions?: string[] };
};

export type AssetResource = {
  id: string;
  name: string;
  type?: string;
  status?: string;
  owner?: string | null;
  aiContextReady?: boolean;
  source?: string;
  webViewLink?: string;
};

export type AssetsPacket = {
  summary?: Record<string, number>;
  resources?: AssetResource[];
  blockedActions?: string[];
  agentPacket?: { mode?: string; instructions?: string[] };
};

export type CoreAreaKey =
  | "00-ogolny"
  | "01-strategia"
  | "02-produkt"
  | "03-sprzedaz"
  | "04-operacje"
  | "05-relacje"
  | "06-kadry"
  | "07-finanse"
  | "08-zasoby"
  | "09-technologia"
  | "10-prawo"
  | "11-innowacje"
  | "12-zarzadzanie";

export type CoreArea = {
  key: CoreAreaKey;
  labelKey: string;
  eyebrowKey: string;
  href?: string;
  descriptionKey: string;
  icon: string;
  enabled?: boolean;
  views?: DepartmentView[];
};

export type DepartmentView = {
  key: string;
  labelKey: string;
  href?: string;
  enabled?: boolean;
};
