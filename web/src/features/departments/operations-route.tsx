import { CcDataTable, type CcTableColumn } from "../../components/cc-data-table";
import { CcButton } from "../../components/cc-button";
import { Shell } from "../../layout/shell";
import { useOwnerPacket } from "../../hooks/use-owner-packet";
import { useLanguage } from "../../i18n/i18n";
import { OperationsPacket, OperationsWorkItem } from "../../types";
import { BlockedActions, SummaryGrid, useTranslatedTableLabels } from "./shared";

function currentOperationsView() {
  const view = new URLSearchParams(window.location.search).get("view");
  return view === "tasks" ? "tasks" : "overview";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function OperationsRoute() {
  const { t } = useLanguage();
  const activeView = currentOperationsView();
  const packet = useOwnerPacket<OperationsPacket>("/v1/operations/work-items?limit=100", true, t);
  const rows = (packet.data?.workItems || []).map((item) => ({ ...item, id: item.task.id }));
  const tableLabels = useTranslatedTableLabels();
  const columns: Array<CcTableColumn<OperationsWorkItem>> = [
    { key: "title", header: t("table.workItem"), cell: (row) => <strong>{row.task.title}</strong> },
    { key: "status", header: t("table.status"), cell: (row) => <span className="badge badge-outline">{row.task.normalizedStatus || row.task.status || t("state.backlog")}</span> },
    { key: "priority", header: t("table.priority"), cell: (row) => row.task.priority || t("state.medium") },
    { key: "source", header: t("table.source"), cell: (row) => row.task.source || t("state.native") },
    { key: "list", header: t("table.list"), cell: (row) => row.hierarchy?.taskList?.name || "—" },
    { key: "due", header: t("table.dueDate"), cell: (row) => formatDate(row.task.dueDate) },
    {
      key: "readiness",
      header: t("table.readiness"),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.readiness?.blocked ? <span className="badge badge-error badge-outline">{t("state.blocked")}</span> : null}
          {row.readiness?.overdue ? <span className="badge badge-warning badge-outline">{t("state.overdue")}</span> : null}
          <span className="badge badge-ghost">{row.readiness?.riskLevel || t("state.needsReview")}</span>
        </div>
      )
    }
  ];
  const visibleRows = activeView === "overview" ? rows.slice(0, 12) : rows;

  return (
    <Shell activeArea="04-operacje">
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-primary">{t("areas.04.label")}</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">{t("operations.title")}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-company-muted">{t("operations.description")}</p>
      </section>
      <div className="tabs tabs-boxed w-fit">
        <a className={`tab ${activeView === "overview" ? "tab-active" : ""}`} href="/areas?area=04-operacje&view=overview">{t("views.04.overview")}</a>
        <a className={`tab ${activeView === "tasks" ? "tab-active" : ""}`} href="/areas?area=04-operacje&view=tasks">{t("views.04.tasks")}</a>
      </div>
      <SummaryGrid summary={packet.data?.summary} />
      <CcDataTable
        columns={columns}
        rows={visibleRows}
        emptyTitle={t("operations.noItems")}
        emptyDetail={t("operations.noItems.detail")}
        error={packet.status === "error" ? packet.error || t("operations.packetError") : null}
        getRowLabel={(row) => row.task.title}
        labels={tableLabels}
        loading={packet.status === "loading"}
        mobileMode="cards"
        rowActions={(row) => row.task.externalId && row.task.source === "clickup" ? (
          <CcButton href={`https://app.clickup.com/t/${row.task.externalId}`} size="xs" target="_blank" rel="noreferrer" variant="ghost">{t("operations.openClickUp")}</CcButton>
        ) : null}
      />
      {activeView === "overview" && rows.length > visibleRows.length ? (
        <div className="flex justify-end">
          <CcButton href="/areas?area=04-operacje&view=tasks" iconRight="ph-arrow-right" variant="outline">{t("operations.viewAllTasks")}</CcButton>
        </div>
      ) : null}
      <BlockedActions actions={packet.data?.agentPacket?.blockedActions || packet.data?.blockedActions} />
    </Shell>
  );
}
