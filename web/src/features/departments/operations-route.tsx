import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { userErrorMessage } from "../../api/errors";
import { CcButton } from "../../components/cc-button";
import { CcField } from "../../components/cc-field";
import { CcNotice } from "../../components/cc-notice";
import { CcTextInput } from "../../components/cc-text-input";
import { Shell } from "../../layout/shell";
import { useOwnerPacket } from "../../hooks/use-owner-packet";
import { useLanguage } from "../../i18n/i18n";
import { OperationsPacket, OperationsStatusColumn, OperationsTaskList, OperationsWorkItem } from "../../types";

type OperationsView = "overview" | "tasks" | "calendar";
type CalendarMode = "today" | "week" | "month";

const fallbackStatuses: OperationsStatusColumn[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
  { key: "archived", label: "Archived" }
];

const priorityOptions = ["urgent", "critical", "high", "normal", "medium", "low", "someday"];

function currentOperationsView(): OperationsView {
  const view = new URLSearchParams(window.location.search).get("view");
  if (view === "tasks" || view === "calendar") {
    return view;
  }
  return "overview";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function inputDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayDistance(value?: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  const due = startOfDay(new Date(value));
  const today = startOfDay();
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function statusTone(status?: string) {
  if (status === "blocked") {
    return "border-error/35 bg-error/5";
  }
  if (status === "done" || status === "archived") {
    return "border-success/25 bg-success/5";
  }
  if (status === "in_progress" || status === "review") {
    return "border-primary/35 bg-primary/5";
  }
  return "border-base-300 bg-base-100";
}

function priorityTone(priority?: string | null) {
  const normalized = (priority || "normal").toLowerCase();
  if (normalized === "urgent" || normalized === "critical") {
    return { className: "badge-error", icon: "ph-warning-diamond" };
  }
  if (normalized === "high") {
    return { className: "badge-warning", icon: "ph-flag" };
  }
  if (normalized === "low" || normalized === "someday") {
    return { className: "badge-ghost", icon: "ph-arrow-down" };
  }
  return { className: "badge-primary badge-outline", icon: "ph-dot-outline" };
}

function taskBelongsToList(task: OperationsWorkItem, listId: string) {
  if (listId === "all") {
    return true;
  }
  if (listId === "unassigned") {
    return !task.hierarchy?.taskList?.id;
  }
  return task.hierarchy?.taskList?.id === listId;
}

function missingFieldLabel(field: string) {
  return field
    .replace(/^task\./, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const tone = priorityTone(priority);
  return (
    <span className={`badge badge-sm gap-1 ${tone.className}`}>
      <i className={`ph-bold ${tone.icon}`} aria-hidden="true"></i>
      {priority || "normal"}
    </span>
  );
}

function DueBadge({ dueDate, overdue }: { dueDate?: string | null; overdue?: boolean }) {
  return (
    <span className={`badge badge-sm gap-1 ${overdue ? "badge-warning" : "badge-outline"}`}>
      <i className="ph-bold ph-calendar-blank" aria-hidden="true"></i>
      {formatDate(dueDate)}
    </span>
  );
}

function TaskCard({ row, onOpen }: { row: OperationsWorkItem; onOpen: () => void }) {
  return (
    <button
      className={`grid gap-3 rounded-company border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-md ${statusTone(row.task.status)}`}
      onClick={onOpen}
      type="button"
    >
      <div className="grid gap-1">
        <strong className="line-clamp-2 text-sm leading-5 text-company-ink">{row.task.title}</strong>
        <span className="text-xs text-company-muted">{row.hierarchy?.project?.name || row.hierarchy?.taskList?.name || row.task.source || "native"}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <PriorityBadge priority={row.task.priority} />
        <DueBadge dueDate={row.task.dueDate} overdue={row.readiness?.overdue} />
        {row.readiness?.blocked ? <span className="badge badge-error badge-outline badge-sm">blocked</span> : null}
      </div>
      {row.evidence?.projectResources?.length ? (
        <span className="flex items-center gap-1 text-xs font-bold text-company-muted">
          <i className="ph-bold ph-paperclip" aria-hidden="true"></i>
          {row.evidence.projectResources.slice(0, 2).map((resource) => resource.name || resource.type || "resource").join(", ")}
        </span>
      ) : null}
    </button>
  );
}

function TaskPreviewModal({
  item,
  statuses,
  onClose,
  onSaved
}: {
  item: OperationsWorkItem;
  statuses: OperationsStatusColumn[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const missingFields = item.readiness?.missingFields || [];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dueDate = String(form.get("dueDate") || "");
    setSaveState("saving");
    setError("");

    try {
      await api(`/v1/operations/work-items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: String(form.get("title") || ""),
          description: String(form.get("description") || ""),
          status: String(form.get("status") || "todo"),
          priority: String(form.get("priority") || ""),
          dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : null
        })
      });
      onSaved();
      onClose();
    } catch (saveError) {
      setSaveState("error");
      setError(userErrorMessage(saveError, t));
    }
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-neutral/55 p-4" role="dialog" aria-modal="true" aria-labelledby="operations-task-modal-title">
      <form className="grid max-h-[92vh] w-full max-w-5xl gap-5 overflow-y-auto rounded-company border border-base-300 bg-base-100 p-5 shadow-2xl" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-xs font-black uppercase text-primary">{item.task.source || t("state.native")}</p>
            <h2 className="text-2xl font-black text-company-ink" id="operations-task-modal-title">{t("operations.taskPreview")}</h2>
            <p className="text-sm text-company-muted">{item.hierarchy?.taskList?.name || t("operations.unassigned")}</p>
          </div>
          <CcButton ariaLabel={t("operations.closeTask")} onClick={onClose} size="sm" variant="ghost">
            <i className="ph-bold ph-x" aria-hidden="true"></i>
            <span className="sr-only">{t("operations.closeTask")}</span>
          </CcButton>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="grid gap-4">
            <CcField label={t("operations.titleField")}>
              {({ id }) => (
                <CcTextInput id={id} name="title" defaultValue={item.task.title} required />
              )}
            </CcField>

            <label className="form-control">
              <span className="label"><span className="label-text font-bold">{t("operations.descriptionField")}</span></span>
              <textarea className="textarea textarea-bordered min-h-36" name="description" defaultValue={item.task.description || ""}></textarea>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="form-control">
                <span className="label"><span className="label-text font-bold">{t("table.status")}</span></span>
                <select className="select select-bordered" name="status" defaultValue={item.task.status || "todo"}>
                  {statuses.map((status) => (
                    <option key={status.key} value={status.key}>{status.label}</option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label"><span className="label-text font-bold">{t("table.priority")}</span></span>
                <select className="select select-bordered" name="priority" defaultValue={item.task.priority || "normal"}>
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <CcField label={t("table.dueDate")}>
                {({ id }) => (
                  <CcTextInput id={id} name="dueDate" type="date" defaultValue={inputDate(item.task.dueDate)} />
                )}
              </CcField>
            </div>

            {error ? <CcNotice tone="error" title={error} live /> : null}
          </section>

          <aside className="grid content-start gap-3">
            <section className="rounded-company border border-base-300 bg-base-200/50 p-4">
              <h3 className="text-sm font-black uppercase text-company-ink">{t("operations.operationalDetail")}</h3>
              <dl className="mt-3 grid gap-3 text-sm">
                <div>
                  <dt className="font-bold text-company-muted">{t("table.list")}</dt>
                  <dd className="text-company-ink">{item.hierarchy?.taskList?.name || t("operations.unassigned")}</dd>
                </div>
                <div>
                  <dt className="font-bold text-company-muted">{t("operations.project")}</dt>
                  <dd className="text-company-ink">{item.hierarchy?.project?.name || "-"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-company-muted">{t("operations.updated")}</dt>
                  <dd className="text-company-ink">{formatDate(item.task.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-company-muted">{t("table.source")}</dt>
                  <dd className="text-company-ink">{item.task.source || t("state.native")}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-company border border-base-300 bg-base-100 p-4">
              <h3 className="text-sm font-black uppercase text-company-ink">{t("operations.readinessTitle")}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.readiness?.blocked ? <span className="badge badge-error">{t("state.blocked")}</span> : <span className="badge badge-success">{t("state.ready")}</span>}
                {item.readiness?.overdue ? <span className="badge badge-warning">{t("state.overdue")}</span> : null}
                {item.readiness?.dependencyCount ? <span className="badge badge-outline">{item.readiness.dependencyCount} {t("operations.dependencies")}</span> : null}
              </div>
              {missingFields.length ? (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase text-company-muted">{t("operations.missingModel")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {missingFields.map((field) => (
                      <span className="badge badge-ghost badge-sm" key={field}>{missingFieldLabel(field)}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {item.evidence?.projectResources?.length ? (
              <section className="rounded-company border border-base-300 bg-base-100 p-4">
                <h3 className="text-sm font-black uppercase text-company-ink">{t("operations.linkedResources")}</h3>
                <div className="mt-3 grid gap-2">
                  {item.evidence.projectResources.slice(0, 4).map((resource) => (
                    <div className="rounded-company border border-base-300 bg-base-200/50 px-3 py-2 text-sm" key={resource.id}>
                      <strong className="block text-company-ink">{resource.name || t("state.resource")}</strong>
                      <span className="text-company-muted">{resource.type || "-"}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-base-300 pt-4">
          <CcButton onClick={onClose} variant="ghost">{t("operations.cancel")}</CcButton>
          <CcButton loading={saveState === "saving"} type="submit" variant="primary">{t("operations.saveTask")}</CcButton>
        </div>
      </form>
    </div>
  );
}

function OperationsBoard({
  rows,
  taskLists,
  statuses,
  selectedListId,
  setSelectedListId,
  setSelectedTask,
  onRefresh
}: {
  rows: OperationsWorkItem[];
  taskLists: OperationsTaskList[];
  statuses: OperationsStatusColumn[];
  selectedListId: string;
  setSelectedListId: (listId: string) => void;
  setSelectedTask: (task: OperationsWorkItem) => void;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const allList: OperationsTaskList = { id: "all", name: t("operations.allTasks"), description: t("operations.allTasksDescription"), source: t("state.native") };
  const usableLists = [
    allList,
    ...taskLists.filter((list) => list.id === "unassigned" || rows.some((row) => taskBelongsToList(row, list.id)))
  ];
  const activeListId = selectedListId || "all";
  const activeList = usableLists.find((list) => list.id === activeListId) || allList;
  const visibleRows = rows.filter((row) => taskBelongsToList(row, activeListId));

  useEffect(() => {
    if (!selectedListId) {
      setSelectedListId("all");
    }
  }, [selectedListId, setSelectedListId]);

  return (
    <section className="grid gap-4 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="grid max-h-[calc(100vh-12rem)] content-start gap-2 overflow-y-auto rounded-company border border-base-300 bg-base-100 p-3">
        <p className="px-2 text-xs font-black uppercase text-company-muted">{t("operations.lists")}</p>
        {usableLists.length ? usableLists.map((list) => (
          <button
            className={[
              "grid gap-1 rounded-company px-3 py-2 text-left transition",
              activeListId === list.id ? "bg-primary text-primary-content" : "hover:bg-base-200"
            ].join(" ")}
            key={list.id}
            onClick={() => setSelectedListId(list.id)}
            type="button"
          >
            <strong>{list.name}</strong>
            <span className={activeListId === list.id ? "text-primary-content/70" : "text-company-muted"}>{list.project?.name || list.source || t("state.native")}</span>
          </button>
        )) : (
          <CcNotice tone="info" title={t("operations.noItems")} detail={t("operations.noItems.detail")} />
        )}
      </aside>

      <div className="min-w-0 rounded-company border border-base-300 bg-base-100 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-company-ink">{activeList.name}</h2>
            <p className="text-sm text-company-muted">{activeList.description || t("operations.boardDescription")}</p>
          </div>
          <CcButton onClick={onRefresh} iconLeft="ph-arrow-clockwise" variant="outline">{t("operations.refresh")}</CcButton>
        </div>

        <div className="grid auto-cols-[minmax(16rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3 xl:auto-cols-[minmax(17rem,1fr)]">
          {statuses.map((status) => {
            const columnRows = visibleRows.filter((row) => row.task.status === status.key);
            return (
              <section className="grid min-h-[32rem] content-start gap-3 rounded-company border border-base-300 bg-base-200/55 p-3" key={status.key}>
                <h3 className="text-sm font-black uppercase text-company-muted">{status.label}</h3>
                {columnRows.length ? columnRows.map((row) => (
                  <TaskCard key={row.id} row={row} onOpen={() => setSelectedTask(row)} />
                )) : (
                  <div className="grid min-h-24 place-items-center rounded-company border border-dashed border-base-300 bg-base-100/55 px-3 text-center text-sm text-company-muted">
                    {t("operations.emptyColumn")}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CalendarLane({
  title,
  rows,
  onOpen,
  emptyLabel
}: {
  title: string;
  rows: OperationsWorkItem[];
  onOpen: (row: OperationsWorkItem) => void;
  emptyLabel: string;
}) {
  return (
    <section className="grid content-start gap-3 rounded-company border border-base-300 bg-base-100 p-3">
      <h3 className="text-sm font-black uppercase text-company-muted">{title}</h3>
      {rows.length ? rows.map((row) => (
        <TaskCard key={row.id} row={row} onOpen={() => onOpen(row)} />
      )) : (
        <div className="grid min-h-24 place-items-center rounded-company border border-dashed border-base-300 bg-base-200/50 px-3 text-center text-sm text-company-muted">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}

function OperationsCalendar({
  rows,
  setSelectedTask
}: {
  rows: OperationsWorkItem[];
  setSelectedTask: (task: OperationsWorkItem) => void;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<CalendarMode>("week");
  const sortedRows = [...rows].sort((left, right) => dayDistance(left.task.dueDate) - dayDistance(right.task.dueDate));
  const overdue = sortedRows.filter((row) => dayDistance(row.task.dueDate) < 0 && row.task.status !== "done");
  const today = sortedRows.filter((row) => dayDistance(row.task.dueDate) === 0);
  const week = sortedRows.filter((row) => dayDistance(row.task.dueDate) > 0 && dayDistance(row.task.dueDate) <= 7);
  const month = sortedRows.filter((row) => dayDistance(row.task.dueDate) > 7 && dayDistance(row.task.dueDate) <= 31);
  const unscheduled = sortedRows.filter((row) => !row.task.dueDate);
  const calendarLabels: Record<CalendarMode, string> = {
    today: t("operations.calendar.today"),
    week: t("operations.calendar.week"),
    month: t("operations.calendar.month")
  };
  const lanes = mode === "today"
    ? [
      { title: t("state.overdue"), rows: overdue },
      { title: t("operations.calendar.today"), rows: today },
      { title: t("operations.unscheduled"), rows: unscheduled }
    ]
    : mode === "week"
      ? [
        { title: t("state.overdue"), rows: overdue },
        { title: t("operations.calendar.today"), rows: today },
        { title: t("operations.calendar.week"), rows: week },
        { title: t("operations.unscheduled"), rows: unscheduled }
      ]
      : [
        { title: t("state.overdue"), rows: overdue },
        { title: t("operations.calendar.today"), rows: today },
        { title: t("operations.calendar.week"), rows: week },
        { title: t("operations.calendar.month"), rows: month },
        { title: t("operations.unscheduled"), rows: unscheduled }
      ];

  return (
    <section className="grid gap-4 rounded-company border border-base-300 bg-base-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-company-ink">{t("operations.calendarTitle")}</h2>
          <p className="text-sm text-company-muted">{t("operations.calendarDescription")}</p>
        </div>
        <div className="join">
          {(["today", "week", "month"] as CalendarMode[]).map((option) => (
            <button
              className={`btn join-item btn-sm ${mode === option ? "btn-primary" : "btn-outline"}`}
              key={option}
              onClick={() => setMode(option)}
              type="button"
            >
              {calendarLabels[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
        {lanes.map((lane) => (
          <CalendarLane
            key={lane.title}
            title={lane.title}
            rows={lane.rows}
            onOpen={setSelectedTask}
            emptyLabel={t("operations.emptyCalendar")}
          />
        ))}
      </div>
    </section>
  );
}

export function OperationsRoute() {
  const { t } = useLanguage();
  const activeView = currentOperationsView();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedListId, setSelectedListId] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<OperationsWorkItem | null>(null);
  const packet = useOwnerPacket<OperationsPacket>(`/v1/operations/work-items?limit=200&refresh=${refreshKey}`, true, t);
  const rows = useMemo(() => (packet.data?.workItems || []).map((item) => ({ ...item, id: item.task.id })), [packet.data?.workItems]);
  const taskLists = packet.data?.taskLists || [];
  const statuses = packet.data?.statuses?.length ? packet.data.statuses : fallbackStatuses;

  return (
    <Shell activeArea="04-operacje">
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-primary">{t("areas.04.label")}</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">{t("operations.title")}</h1>
        <p className="mt-3 max-w-4xl leading-7 text-company-muted">{t("operations.description")}</p>
      </section>

      <div className="tabs tabs-boxed w-fit">
        <a className={`tab ${activeView === "overview" ? "tab-active" : ""}`} href="/areas?area=04-operacje&view=overview">{t("views.04.overview")}</a>
        <a className={`tab ${activeView === "tasks" ? "tab-active" : ""}`} href="/areas?area=04-operacje&view=tasks">{t("views.04.tasks")}</a>
        <a className={`tab ${activeView === "calendar" ? "tab-active" : ""}`} href="/areas?area=04-operacje&view=calendar">{t("views.04.calendar")}</a>
      </div>

      {packet.status === "loading" ? <CcNotice tone="loading" title={t("table.loading.title")} detail={t("table.loading.detail")} /> : null}
      {packet.status === "error" ? <CcNotice tone="error" title={packet.error || t("operations.packetError")} live /> : null}

      {packet.status === "ready" ? (
        activeView === "calendar" ? (
          <OperationsCalendar rows={rows} setSelectedTask={setSelectedTask} />
        ) : (
          <OperationsBoard
            rows={rows}
            taskLists={taskLists}
            statuses={statuses}
            selectedListId={selectedListId}
            setSelectedListId={setSelectedListId}
            setSelectedTask={setSelectedTask}
            onRefresh={() => setRefreshKey((value) => value + 1)}
          />
        )
      ) : null}

      {selectedTask ? (
        <TaskPreviewModal
          item={selectedTask}
          statuses={statuses}
          onClose={() => setSelectedTask(null)}
          onSaved={() => setRefreshKey((value) => value + 1)}
        />
      ) : null}
    </Shell>
  );
}
