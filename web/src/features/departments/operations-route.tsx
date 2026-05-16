import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { userErrorMessage } from "../../api/errors";
import { CcButton } from "../../components/cc-button";
import { CcField } from "../../components/cc-field";
import { CcNotice } from "../../components/cc-notice";
import { CcTextInput } from "../../components/cc-text-input";
import { Shell } from "../../layout/shell";
import { useOwnerPacket } from "../../hooks/use-owner-packet";
import { useLanguage } from "../../i18n/i18n";
import { OperationsArea, OperationsPacket, OperationsStatusColumn, OperationsTaskList, OperationsWorkItem } from "../../types";

type OperationsView = "tasks" | "calendar";
type CalendarMode = "today" | "week" | "month";

const fallbackStatuses: OperationsStatusColumn[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
  { key: "archived", label: "Archived" }
];

const priorityOptions = ["urgent", "critical", "high", "normal", "medium", "low", "someday"];

function currentOperationsView(): OperationsView {
  return new URLSearchParams(window.location.search).get("view") === "calendar" ? "calendar" : "tasks";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function inputDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(value = new Date()) {
  const date = startOfDay(value);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

function sameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function daysInCurrentMonth() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Array.from({ length: days }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index + 1));
}

function dayDistance(value?: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.round((startOfDay(new Date(value)).getTime() - startOfDay().getTime()) / 86_400_000);
}

function statusTone(status?: string) {
  if (status === "blocked") return "border-error/35 bg-error/5";
  if (status === "done" || status === "archived") return "border-success/25 bg-success/5";
  if (status === "in_progress") return "border-primary/35 bg-primary/5";
  return "border-base-300 bg-base-100";
}

function priorityTone(priority?: string | null) {
  const normalized = (priority || "normal").toLowerCase();
  if (normalized === "urgent" || normalized === "critical") return { className: "badge-error", icon: "ph-warning-diamond" };
  if (normalized === "high") return { className: "badge-warning", icon: "ph-flag" };
  if (normalized === "low" || normalized === "someday") return { className: "badge-ghost", icon: "ph-arrow-down" };
  return { className: "badge-primary badge-outline", icon: "ph-dot-outline" };
}

function taskBelongsToList(task: OperationsWorkItem, listId: string) {
  if (listId === "all") return true;
  if (listId === "unassigned") return !task.hierarchy?.taskList?.id;
  return task.hierarchy?.taskList?.id === listId;
}

function missingFieldLabel(field: string) {
  return field.replace(/^task\./, "").replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function listArea(list: OperationsTaskList, areas: OperationsArea[]) {
  return list.areaAssignment?.area ?? areas.find((area) => (
    list.project?.name.toLowerCase().includes(area.name.toLowerCase())
    || list.name.toLowerCase().includes(area.name.toLowerCase())
  )) ?? null;
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

function TaskCard({
  row,
  onOpen,
  onDragStart
}: {
  row: OperationsWorkItem;
  onOpen: () => void;
  onDragStart?: () => void;
}) {
  return (
    <button
      className={`grid gap-2 rounded-company border p-3 text-left shadow-sm transition hover:border-primary hover:bg-primary/5 hover:shadow-md ${statusTone(row.task.status)}`}
      draggable
      onClick={onOpen}
      onDragStart={onDragStart}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <strong className="line-clamp-2 text-sm leading-5 text-company-ink">{row.task.title}</strong>
        <i className="ph-bold ph-dots-six-vertical mt-0.5 shrink-0 text-company-muted" aria-hidden="true"></i>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <PriorityBadge priority={row.task.priority} />
        <DueBadge dueDate={row.task.dueDate} overdue={row.readiness?.overdue} />
        {row.task.description ? <span className="badge badge-ghost badge-sm gap-1"><i className="ph-bold ph-text-align-left" aria-hidden="true"></i></span> : null}
        {row.evidence?.projectResources?.length ? <span className="badge badge-ghost badge-sm gap-1"><i className="ph-bold ph-paperclip" aria-hidden="true"></i></span> : null}
        {row.readiness?.blocked ? <span className="badge badge-error badge-outline badge-sm">{row.readiness.dependencyCount || "!"}</span> : null}
      </div>
      <span className="truncate text-xs text-company-muted">{row.hierarchy?.project?.name || row.hierarchy?.taskList?.name || row.task.source || "native"}</span>
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
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={item.task.priority} />
              <DueBadge dueDate={item.task.dueDate} overdue={item.readiness?.overdue} />
              <span className="badge badge-outline badge-sm">{item.task.source || t("state.native")}</span>
            </div>
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
              {({ id }) => <CcTextInput id={id} name="title" defaultValue={item.task.title} required />}
            </CcField>

            <label className="form-control">
              <span className="label"><span className="label-text font-bold"><i className="ph-bold ph-text-align-left mr-1" aria-hidden="true"></i>{t("operations.descriptionField")}</span></span>
              <textarea className="textarea textarea-bordered min-h-32" name="description" defaultValue={item.task.description || ""}></textarea>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="form-control">
                <span className="label"><span className="label-text font-bold">{t("table.status")}</span></span>
                <select className="select select-bordered" name="status" defaultValue={item.task.status || "todo"}>
                  {statuses.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}
                </select>
              </label>
              <label className="form-control">
                <span className="label"><span className="label-text font-bold">{t("table.priority")}</span></span>
                <select className="select select-bordered" name="priority" defaultValue={item.task.priority || "normal"}>
                  {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <CcField label={t("table.dueDate")}>
                {({ id }) => <CcTextInput id={id} name="dueDate" type="date" defaultValue={inputDate(item.task.dueDate)} />}
              </CcField>
            </div>

            {error ? <CcNotice tone="error" title={error} live /> : null}
          </section>

          <aside className="grid content-start gap-3">
            <section className="rounded-company border border-base-300 bg-base-200/50 p-4">
              <h3 className="text-sm font-black uppercase text-company-ink">{t("operations.operationalDetail")}</h3>
              <dl className="mt-3 grid gap-3 text-sm">
                <div><dt className="font-bold text-company-muted">{t("table.list")}</dt><dd>{item.hierarchy?.taskList?.name || t("operations.unassigned")}</dd></div>
                <div><dt className="font-bold text-company-muted">{t("operations.project")}</dt><dd>{item.hierarchy?.project?.name || "-"}</dd></div>
                <div><dt className="font-bold text-company-muted">{t("operations.updated")}</dt><dd>{formatDate(item.task.updatedAt)}</dd></div>
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
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {missingFields.map((field) => <span className="badge badge-ghost badge-sm" key={field}>{missingFieldLabel(field)}</span>)}
                </div>
              ) : null}
            </section>
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

function TaskListModal({
  list,
  areas,
  onClose,
  onSaved
}: {
  list: OperationsTaskList;
  areas: OperationsArea[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaveState("saving");
    setError("");

    try {
      await api(`/v1/operations/task-lists/${list.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          description: String(form.get("description") || ""),
          status: String(form.get("status") || "active"),
          areaId: String(form.get("areaId") || "") || null
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
    <div className="fixed inset-0 z-30 grid place-items-center bg-neutral/55 p-4" role="dialog" aria-modal="true" aria-labelledby="operations-list-modal-title">
      <form className="grid w-full max-w-2xl gap-4 rounded-company border border-base-300 bg-base-100 p-5 shadow-2xl" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-primary">{list.source || t("state.native")}</p>
            <h2 className="text-2xl font-black text-company-ink" id="operations-list-modal-title">{t("operations.editList")}</h2>
          </div>
          <CcButton ariaLabel={t("operations.closeTask")} onClick={onClose} size="sm" variant="ghost">
            <i className="ph-bold ph-x" aria-hidden="true"></i>
            <span className="sr-only">{t("operations.closeTask")}</span>
          </CcButton>
        </div>
        <CcField label={t("operations.listName")}>
          {({ id }) => <CcTextInput id={id} name="name" defaultValue={list.name} required />}
        </CcField>
        <label className="form-control">
          <span className="label"><span className="label-text font-bold">{t("operations.descriptionField")}</span></span>
          <textarea className="textarea textarea-bordered min-h-24" name="description" defaultValue={list.description || ""}></textarea>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="form-control">
            <span className="label"><span className="label-text font-bold">{t("table.status")}</span></span>
            <select className="select select-bordered" name="status" defaultValue={list.status || "active"}>
              {["active", "paused", "archived"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="form-control">
            <span className="label"><span className="label-text font-bold">{t("operations.departmentAssignment")}</span></span>
            <select className="select select-bordered" name="areaId" defaultValue={list.areaAssignment?.area?.id || ""}>
              <option value="">{t("operations.noDepartment")}</option>
              {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
            </select>
          </label>
        </div>
        {error ? <CcNotice tone="error" title={error} live /> : null}
        <div className="flex flex-wrap justify-end gap-2 border-t border-base-300 pt-4">
          <CcButton onClick={onClose} variant="ghost">{t("operations.cancel")}</CcButton>
          <CcButton loading={saveState === "saving"} type="submit" variant="primary">{t("operations.saveList")}</CcButton>
        </div>
      </form>
    </div>
  );
}

function OperationsBoard({
  rows,
  taskLists,
  areas,
  statuses,
  selectedListId,
  setSelectedListId,
  setSelectedTask,
  setSelectedList,
  onRefresh
}: {
  rows: OperationsWorkItem[];
  taskLists: OperationsTaskList[];
  areas: OperationsArea[];
  statuses: OperationsStatusColumn[];
  selectedListId: string;
  setSelectedListId: (listId: string) => void;
  setSelectedTask: (task: OperationsWorkItem) => void;
  setSelectedList: (list: OperationsTaskList) => void;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [moveError, setMoveError] = useState("");
  const allList: OperationsTaskList = { id: "all", name: t("operations.allTasks"), description: t("operations.allTasksDescription"), source: t("state.native") };
  const unassignedList = taskLists.find((list) => list.id === "unassigned");
  const realLists = taskLists.filter((list) => list.id !== "all" && list.id !== "unassigned" && rows.some((row) => taskBelongsToList(row, list.id)));
  const groups = areas.map((area) => ({
    id: area.id,
    name: area.name,
    lists: realLists.filter((list) => listArea(list, areas)?.id === area.id)
  })).filter((group) => group.lists.length > 0);
  const noDepartment = realLists.filter((list) => !listArea(list, areas));
  const activeListId = selectedListId || "all";
  const activeList = activeListId === "all" ? allList : taskLists.find((list) => list.id === activeListId) || allList;
  const visibleRows = rows.filter((row) => taskBelongsToList(row, activeListId));

  useEffect(() => {
    setOpenGroups((current) => {
      const next = { ...current };
      groups.forEach((group) => {
        if (next[group.id] === undefined) next[group.id] = true;
      });
      if (next.unassigned === undefined) next.unassigned = true;
      return next;
    });
  }, [groups.map((group) => group.id).join("|")]);

  async function moveTaskToStatus(status: string) {
    if (!draggedTaskId) return;
    const task = rows.find((row) => row.id === draggedTaskId);
    if (!task || task.task.status === status) return;
    setMoveError("");
    try {
      await api(`/v1/operations/work-items/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      onRefresh();
    } catch (error) {
      setMoveError(userErrorMessage(error, t));
    } finally {
      setDraggedTaskId("");
    }
  }

  function renderListButton(list: OperationsTaskList) {
    return (
      <div className={`grid grid-cols-[minmax(0,1fr)_2rem] items-stretch rounded-company ${activeListId === list.id ? "bg-primary text-primary-content" : "hover:bg-base-200"}`} key={list.id}>
        <button className="grid min-w-0 gap-0.5 px-3 py-2 text-left" onClick={() => setSelectedListId(list.id)} type="button">
          <strong className="truncate text-sm">{list.name}</strong>
          <span className={`truncate text-xs ${activeListId === list.id ? "text-primary-content/70" : "text-company-muted"}`}>{list.areaAssignment?.area?.name || list.project?.name || list.source || t("state.native")}</span>
        </button>
        <button className={activeListId === list.id ? "text-primary-content/80 hover:bg-black/10" : "text-company-muted hover:text-company-ink"} aria-label={t("operations.editList")} onClick={() => setSelectedList(list)} type="button">
          <i className="ph-bold ph-gear-six" aria-hidden="true"></i>
        </button>
      </div>
    );
  }

  return (
    <section className="grid h-[calc(100vh-12.5rem)] min-h-[34rem] gap-4 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="grid min-h-0 content-start gap-3 overflow-y-auto rounded-company border border-base-300 bg-base-100 p-3">
        <button className={`rounded-company px-3 py-2 text-left ${activeListId === "all" ? "bg-primary text-primary-content" : "hover:bg-base-200"}`} onClick={() => setSelectedListId("all")} type="button">
          <strong className="block text-sm">{t("operations.allTasks")}</strong>
          <span className={activeListId === "all" ? "text-xs text-primary-content/70" : "text-xs text-company-muted"}>{t("operations.allTasksDescription")}</span>
        </button>

        {groups.map((group) => (
          <section className="grid gap-1" key={group.id}>
            <button className="flex items-center justify-between rounded-company px-2 py-1 text-left text-xs font-black uppercase text-company-muted hover:bg-base-200" onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !current[group.id] }))} type="button">
              {group.name}
              <i className={`ph-bold ${openGroups[group.id] ? "ph-caret-up" : "ph-caret-down"}`} aria-hidden="true"></i>
            </button>
            {openGroups[group.id] ? <div className="grid gap-1">{group.lists.map(renderListButton)}</div> : null}
          </section>
        ))}

        <section className="grid gap-1 border-t border-base-300 pt-2">
          <button className="flex items-center justify-between rounded-company px-2 py-1 text-left text-xs font-black uppercase text-company-muted hover:bg-base-200" onClick={() => setOpenGroups((current) => ({ ...current, unassigned: !current.unassigned }))} type="button">
            {t("operations.unassigned")}
            <i className={`ph-bold ${openGroups.unassigned ? "ph-caret-up" : "ph-caret-down"}`} aria-hidden="true"></i>
          </button>
          {openGroups.unassigned ? (
            <div className="grid gap-1">
              {noDepartment.map(renderListButton)}
              {unassignedList ? renderListButton(unassignedList) : null}
            </div>
          ) : null}
        </section>
      </aside>

      <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] rounded-company border border-base-300 bg-base-100 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-company-ink">{activeList.name}</h2>
            <p className="line-clamp-1 text-sm text-company-muted">{activeList.description || t("operations.boardDescription")}</p>
          </div>
          <div className="flex gap-2">
            {activeList.id !== "all" && activeList.id !== "unassigned" ? <CcButton onClick={() => setSelectedList(activeList)} iconLeft="ph-gear-six" variant="ghost">{t("operations.editList")}</CcButton> : null}
            <CcButton onClick={onRefresh} iconLeft="ph-arrow-clockwise" variant="outline">{t("operations.refresh")}</CcButton>
          </div>
        </div>

        {moveError ? <CcNotice tone="error" title={moveError} live /> : null}

        <div className="grid min-h-0 auto-cols-[minmax(15rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3 xl:auto-cols-[minmax(16rem,1fr)]">
          {statuses.map((status) => {
            const columnRows = visibleRows.filter((row) => row.task.status === status.key);
            return (
              <section
                className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-company border border-base-300 bg-base-200/55 p-3"
                key={status.key}
                onDragOver={(event: DragEvent<HTMLElement>) => event.preventDefault()}
                onDrop={() => void moveTaskToStatus(status.key)}
              >
                <h3 className="pb-3 text-sm font-black uppercase text-company-muted">{status.label}</h3>
                <div className="grid content-start gap-2 overflow-y-auto pr-1">
                  {columnRows.length ? columnRows.map((row) => (
                    <TaskCard key={row.id} row={row} onOpen={() => setSelectedTask(row)} onDragStart={() => setDraggedTaskId(row.id)} />
                  )) : (
                    <div className="grid min-h-24 place-items-center rounded-company border border-dashed border-base-300 bg-base-100/55 px-3 text-center text-sm text-company-muted">
                      {t("operations.emptyColumn")}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CalendarTaskPill({ row, onOpen }: { row: OperationsWorkItem; onOpen: () => void }) {
  return (
    <button className={`rounded-company border px-3 py-2 text-left text-xs ${statusTone(row.task.status)}`} onClick={onOpen} type="button">
      <strong className="line-clamp-1 block text-company-ink">{row.task.title}</strong>
      <span className="mt-1 flex gap-1"><PriorityBadge priority={row.task.priority} /></span>
    </button>
  );
}

function OperationsCalendar({ rows, setSelectedTask }: { rows: OperationsWorkItem[]; setSelectedTask: (task: OperationsWorkItem) => void }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<CalendarMode>("week");
  const calendarLabels: Record<CalendarMode, string> = {
    today: t("operations.calendar.today"),
    week: t("operations.calendar.week"),
    month: t("operations.calendar.month")
  };
  const datedRows = rows.filter((row) => row.task.dueDate);
  const todayRows = datedRows.filter((row) => sameDay(new Date(row.task.dueDate!), new Date()));
  const weekStart = startOfWeek();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
  const monthDays = daysInCurrentMonth();
  const monthOffset = monthDays[0] ? ((monthDays[0].getDay() || 7) - 1) : 0;

  return (
    <section className="grid h-[calc(100vh-12.5rem)] min-h-[34rem] grid-rows-[auto_minmax(0,1fr)] gap-4 rounded-company border border-base-300 bg-base-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-company-ink">{t("operations.calendarTitle")}</h2>
          <p className="text-sm text-company-muted">{t("operations.calendarDescription")}</p>
        </div>
        <div className="join">
          {(["today", "week", "month"] as CalendarMode[]).map((option) => (
            <button className={`btn join-item btn-sm ${mode === option ? "btn-primary" : "btn-outline"}`} key={option} onClick={() => setMode(option)} type="button">
              {calendarLabels[option]}
            </button>
          ))}
        </div>
      </div>

      {mode === "today" ? (
        <div className="grid min-h-0 grid-cols-[5rem_minmax(0,1fr)] overflow-y-auto rounded-company border border-base-300">
          <div className="border-b border-base-300 bg-base-200/60 px-3 py-4 text-xs font-black text-company-muted">Today</div>
          <div className="grid gap-2 border-b border-base-300 p-3">
            {todayRows.length ? todayRows.map((row) => <CalendarTaskPill key={row.id} row={row} onOpen={() => setSelectedTask(row)} />) : <span className="text-sm text-company-muted">{t("operations.emptyCalendar")}</span>}
          </div>
          {Array.from({ length: 12 }, (_, index) => index + 8).map((hour) => (
            <div className="contents" key={hour}>
              <div className="border-b border-base-300 bg-base-200/60 px-3 py-4 text-xs font-black text-company-muted">{`${hour}:00`}</div>
              <div className="border-b border-base-300 p-3"></div>
            </div>
          ))}
        </div>
      ) : null}

      {mode === "week" ? (
        <div className="grid min-h-0 grid-cols-7 gap-3 overflow-x-auto">
          {weekDays.map((day) => {
            const dayRows = datedRows.filter((row) => sameDay(new Date(row.task.dueDate!), day));
            return (
              <section className="grid min-w-40 content-start gap-2 overflow-y-auto rounded-company border border-base-300 bg-base-200/55 p-3" key={day.toISOString()}>
                <h3 className="text-sm font-black text-company-ink">{new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric" }).format(day)}</h3>
                {dayRows.length ? dayRows.map((row) => <CalendarTaskPill key={row.id} row={row} onOpen={() => setSelectedTask(row)} />) : <span className="text-sm text-company-muted">{t("operations.emptyCalendar")}</span>}
              </section>
            );
          })}
        </div>
      ) : null}

      {mode === "month" ? (
        <div className="grid min-h-0 grid-cols-7 gap-2 overflow-y-auto">
          {Array.from({ length: monthOffset }, (_, index) => (
            <div aria-hidden="true" className="min-h-24 rounded-company border border-base-300/50 bg-base-200/20" key={`blank-${index}`}></div>
          ))}
          {monthDays.map((day) => {
            const dayRows = datedRows.filter((row) => sameDay(new Date(row.task.dueDate!), day));
            return (
              <button className="grid min-h-24 content-start rounded-company border border-base-300 bg-base-200/45 p-2 text-left hover:border-primary hover:bg-primary/5" key={day.toISOString()} onClick={() => dayRows[0] ? setSelectedTask(dayRows[0]) : undefined} type="button">
                <span className="text-sm font-black text-company-ink">{day.getDate()}</span>
                {dayRows.length ? (
                  <span className="mt-2 flex flex-wrap gap-1">
                    <span className="badge badge-primary badge-sm">{dayRows.length}</span>
                    {dayRows.some((row) => row.readiness?.blocked) ? <span className="badge badge-error badge-sm">!</span> : null}
                    {dayRows.some((row) => row.readiness?.overdue) ? <span className="badge badge-warning badge-sm"><i className="ph-bold ph-clock" aria-hidden="true"></i></span> : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export function OperationsRoute() {
  const { t } = useLanguage();
  const activeView = currentOperationsView();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedListId, setSelectedListId] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<OperationsWorkItem | null>(null);
  const [selectedList, setSelectedList] = useState<OperationsTaskList | null>(null);
  const packet = useOwnerPacket<OperationsPacket>(`/v1/operations/work-items?limit=200&refresh=${refreshKey}`, true, t);
  const rows = useMemo(() => (packet.data?.workItems || []).map((item) => ({ ...item, id: item.task.id })), [packet.data?.workItems]);
  const taskLists = packet.data?.taskLists || [];
  const areas = packet.data?.operatingAreas || [];
  const statuses = packet.data?.statuses?.length ? packet.data.statuses : fallbackStatuses;

  function refresh() {
    setRefreshKey((value) => value + 1);
  }

  return (
    <Shell activeArea="04-operacje">
      <section className="flex flex-wrap items-center justify-end gap-3 rounded-company border border-base-300 bg-base-100 px-4 py-3">
        <h1 className="sr-only">{t("areas.04.label")}</h1>
        <div className="tabs tabs-boxed">
          <a className={`tab ${activeView === "tasks" ? "tab-active" : ""}`} href="/areas?area=04-operacje&view=tasks">{t("views.04.tasks")}</a>
          <a className={`tab ${activeView === "calendar" ? "tab-active" : ""}`} href="/areas?area=04-operacje&view=calendar">{t("views.04.calendar")}</a>
        </div>
      </section>

      {packet.status === "loading" ? <CcNotice tone="loading" title={t("table.loading.title")} detail={t("table.loading.detail")} /> : null}
      {packet.status === "error" ? <CcNotice tone="error" title={packet.error || t("operations.packetError")} live /> : null}

      {packet.status === "ready" ? (
        activeView === "calendar" ? (
          <OperationsCalendar rows={rows} setSelectedTask={setSelectedTask} />
        ) : (
          <OperationsBoard
            rows={rows}
            taskLists={taskLists}
            areas={areas}
            statuses={statuses}
            selectedListId={selectedListId}
            setSelectedListId={setSelectedListId}
            setSelectedTask={setSelectedTask}
            setSelectedList={setSelectedList}
            onRefresh={refresh}
          />
        )
      ) : null}

      {selectedTask ? <TaskPreviewModal item={selectedTask} statuses={statuses} onClose={() => setSelectedTask(null)} onSaved={refresh} /> : null}
      {selectedList ? <TaskListModal list={selectedList} areas={areas} onClose={() => setSelectedList(null)} onSaved={refresh} /> : null}
    </Shell>
  );
}
