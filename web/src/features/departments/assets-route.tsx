import { useEffect, useMemo, useState } from "react";
import { CcButton } from "../../components/cc-button";
import { CcNotice } from "../../components/cc-notice";
import { CcResourceSelector, type CcResourceSelectorGroup } from "../../components/cc-resource-selector";
import { Shell } from "../../layout/shell";
import { useOwnerPacket } from "../../hooks/use-owner-packet";
import { useLanguage } from "../../i18n/i18n";
import { AssetResource, AssetsPacket, CoreAreaKey } from "../../types";
import { SummaryGrid } from "./shared";
import { coreAreas } from "./core-area-data";
import { backendAreaToDepartmentKey, departmentLabel } from "./department-labels";

type AssetsView = "overview" | "files";
type AssetKindFilter = "all" | "folders" | "files";

function currentAssetsView(): AssetsView {
  return new URLSearchParams(window.location.search).get("view") === "files" ? "files" : "overview";
}

function sourceRecord(resource: AssetResource) {
  return resource.source && typeof resource.source === "object" ? resource.source : null;
}

function sourceProvider(resource: AssetResource) {
  const source = sourceRecord(resource);
  if (source?.provider) return source.provider;
  return typeof resource.source === "string" ? resource.source : "CompanyCore";
}

function sourceLink(resource: AssetResource) {
  return sourceRecord(resource)?.webViewLink || resource.webViewLink || null;
}

function sourceExternalId(resource: AssetResource) {
  return sourceRecord(resource)?.externalId || null;
}

function sourceParentExternalId(resource: AssetResource) {
  return sourceRecord(resource)?.parentExternalId || null;
}

function isFolder(resource: AssetResource) {
  return Boolean(sourceRecord(resource)?.isFolder || resource.resourceType === "folder" || resource.type === "folder");
}

function resourceType(resource: AssetResource) {
  return resource.resourceType || resource.type || "resource";
}

function resourceReadiness(resource: AssetResource) {
  if (resource.aiCompatibility?.readiness) return resource.aiCompatibility.readiness;
  if (resource.aiCompatibility?.aiContextReady || resource.aiContextReady) return "ai_context_ready";
  return "metadata_ready";
}

function resourceSummary(resource: AssetResource) {
  return resource.aiCompatibility?.summary || resource.organization?.folder || resource.organization?.knowledgeRoot || "";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function departmentForResource(resource: AssetResource): CoreAreaKey | "unassigned" {
  return backendAreaToDepartmentKey(resource.organization?.department)
    || backendAreaToDepartmentKey(resource.relations?.operatingArea?.key)
    || "unassigned";
}

function resourceIcon(resource: AssetResource) {
  const type = resourceType(resource);
  if (isFolder(resource)) return "ph-folder";
  if (type === "spreadsheet") return "ph-table";
  if (type === "image" || type === "brand_asset") return "ph-image";
  if (type === "video") return "ph-video";
  if (type === "repository") return "ph-git-branch";
  if (type === "contract") return "ph-file-lock";
  if (type === "architecture_doc" || type === "api_reference" || type === "deployment_doc") return "ph-file-code";
  return "ph-file-text";
}

function readinessTone(readiness: string) {
  if (readiness === "ai_context_ready") return "badge-success";
  if (readiness === "relation_ready" || readiness === "summary_ready") return "badge-primary badge-outline";
  if (readiness === "not_indexed") return "badge-warning";
  return "badge-ghost";
}

function AssetsOverview({ packet }: { packet: AssetsPacket | null }) {
  const { t } = useLanguage();
  return (
    <section className="grid gap-4">
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-primary">{t("areas.08.label")}</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">{t("assets.title")}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-company-muted">{t("assets.description")}</p>
      </section>
      <SummaryGrid summary={packet?.summary} />
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-company-ink">{t("assets.filesFoldersTitle")}</h2>
            <p className="mt-1 text-sm text-company-muted">{t("assets.filesFoldersDescription")}</p>
          </div>
          <CcButton href="/areas?area=08-zasoby&view=files" iconLeft="ph-folders" variant="primary">{t("assets.openFiles")}</CcButton>
        </div>
      </section>
    </section>
  );
}

function DepartmentSelector({
  selectedDepartmentIds,
  setSelectedDepartmentIds
}: {
  selectedDepartmentIds: string[];
  setSelectedDepartmentIds: (ids: string[]) => void;
}) {
  const { t } = useLanguage();
  const departments = coreAreas.map((area) => ({
    id: area.key,
    title: departmentLabel(area.key, t),
    detail: t(area.eyebrowKey)
  }));
  const groups: CcResourceSelectorGroup[] = [{
    id: "departments",
    title: t("sidebar.departments"),
    items: departments
  }];

  return (
    <CcResourceSelector
      allDetail={t("operations.visibleResources", { count: departments.length + 1 })}
      allLabel={t("assets.allDepartments")}
      clearLabel={t("operations.clearLists")}
      groups={groups}
      onSelectedIdsChange={setSelectedDepartmentIds}
      selectedIds={selectedDepartmentIds}
      title={t("assets.departmentFilter")}
      ungroupedItems={[{ id: "unassigned", title: t("operations.unassigned"), detail: t("state.needsReview") }]}
      ungroupedTitle={t("operations.unassigned")}
    />
  );
}

function AssetCard({
  resource,
  selected,
  onSelect
}: {
  resource: AssetResource;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useLanguage();
  const readiness = resourceReadiness(resource);
  const department = departmentForResource(resource);
  return (
    <button className={`grid gap-2 rounded-company border p-3 text-left transition hover:border-primary hover:bg-primary/5 ${selected ? "border-primary/50 bg-primary/10" : "border-base-300 bg-base-100"}`} onClick={onSelect} type="button">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-company border border-base-300 bg-base-200 text-company-muted">
          <i className={`ph-bold ${resourceIcon(resource)}`} aria-hidden="true"></i>
        </span>
        <span className="min-w-0 flex-1">
          <strong className="line-clamp-2 text-sm leading-5 text-company-ink">{resource.name}</strong>
          <span className="mt-1 block truncate text-xs text-company-muted">{isFolder(resource) ? t("assets.folder") : resourceType(resource)} · {sourceProvider(resource)}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className={`badge badge-sm ${readinessTone(readiness)}`}>{readiness.replaceAll("_", " ")}</span>
        <span className="badge badge-outline badge-sm">{department === "unassigned" ? t("state.unassigned") : departmentLabel(department, t)}</span>
      </div>
      <span className="truncate text-xs text-company-muted">{formatDate(resource.freshness?.modifiedTime)}</span>
    </button>
  );
}

function AssetsFilesView({ packet }: { packet: AssetsPacket }) {
  const { t } = useLanguage();
  const resources = packet.resources || [];
  const departmentIds = [...coreAreas.map((area) => area.key), "unassigned"];
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(departmentIds);
  const [kindFilter, setKindFilter] = useState<AssetKindFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedFolderExternalId, setSelectedFolderExternalId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState(resources[0]?.id || "");

  useEffect(() => {
    setSelectedDepartmentIds((current) => current.length ? current.filter((id) => departmentIds.includes(id)) : departmentIds);
  }, [departmentIds.join("|")]);

  const filteredResources = useMemo(() => {
    const selectedDepartments = new Set(selectedDepartmentIds);
    const normalizedQuery = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const department = departmentForResource(resource);
      const departmentMatch = selectedDepartments.has(department);
      const kindMatch = kindFilter === "all" || (kindFilter === "folders" ? isFolder(resource) : !isFolder(resource));
      const folderMatch = !selectedFolderExternalId || sourceParentExternalId(resource) === selectedFolderExternalId || sourceExternalId(resource) === selectedFolderExternalId;
      const textMatch = !normalizedQuery || [resource.name, resourceType(resource), sourceProvider(resource), resourceSummary(resource)].join(" ").toLowerCase().includes(normalizedQuery);
      return departmentMatch && kindMatch && folderMatch && textMatch;
    });
  }, [resources, selectedDepartmentIds, kindFilter, query, selectedFolderExternalId]);

  const folders = filteredResources.filter(isFolder);
  const selectedResource = filteredResources.find((resource) => resource.id === selectedResourceId) || filteredResources[0] || null;

  return (
    <section className="grid gap-4 xl:h-[calc(100vh-12.5rem)] xl:min-h-[34rem] xl:grid-cols-[17rem_minmax(0,1fr)]">
      <DepartmentSelector selectedDepartmentIds={selectedDepartmentIds} setSelectedDepartmentIds={setSelectedDepartmentIds} />
      <div className="grid gap-4 xl:min-h-0 xl:grid-cols-[14rem_minmax(0,1fr)] 2xl:grid-cols-[14rem_minmax(0,1fr)_18rem]">
        <aside className="grid content-start gap-3 overflow-y-auto rounded-company border border-base-300 bg-base-100 p-3 xl:min-h-0">
          <div className="sticky top-0 z-10 grid gap-2 rounded-company border border-base-300 bg-base-100/95 p-2.5 shadow-sm backdrop-blur">
            <span className="text-xs font-black uppercase text-company-muted">{t("assets.folders")}</span>
            <button className={`btn btn-xs ${selectedFolderExternalId ? "btn-ghost" : "btn-primary"}`} onClick={() => setSelectedFolderExternalId(null)} type="button">{t("assets.allFolders")}</button>
          </div>
          <div className="grid gap-1">
            {folders.map((folder) => {
              const externalId = sourceExternalId(folder);
              const selected = Boolean(externalId && selectedFolderExternalId === externalId);
              return (
                <button className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-company px-2 py-2 text-left text-sm ${selected ? "bg-primary/10 text-company-ink" : "hover:bg-base-200"}`} disabled={!externalId} key={folder.id} onClick={() => setSelectedFolderExternalId(externalId)} type="button">
                  <i className="ph-bold ph-folder text-company-muted" aria-hidden="true"></i>
                  <span className="truncate">{folder.name}</span>
                </button>
              );
            })}
            {!folders.length ? <p className="rounded-company border border-dashed border-base-300 p-3 text-sm text-company-muted">{t("assets.noFolders")}</p> : null}
          </div>
        </aside>

        <main className="grid gap-3 rounded-company border border-base-300 bg-base-100 p-3 xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)]">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-black text-company-ink">{t("assets.filesFoldersTitle")}</h1>
                <p className="text-sm text-company-muted">{t("assets.visibleItems", { count: filteredResources.length })}</p>
              </div>
              <div className="join">
                {(["all", "folders", "files"] as AssetKindFilter[]).map((kind) => (
                  <button className={`btn join-item btn-sm ${kindFilter === kind ? "btn-primary" : "btn-outline"}`} key={kind} onClick={() => setKindFilter(kind)} type="button">{t(`assets.kind.${kind}`)}</button>
                ))}
              </div>
            </div>
            <label className="input input-bordered flex items-center gap-2">
              <i className="ph-bold ph-magnifying-glass text-company-muted" aria-hidden="true"></i>
              <input className="grow" onChange={(event) => setQuery(event.target.value)} placeholder={t("assets.searchPlaceholder")} type="search" value={query} />
            </label>
          </div>

          <div className="overflow-y-auto xl:min-h-0">
            {filteredResources.length ? (
              <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredResources.map((resource) => (
                  <AssetCard key={resource.id} onSelect={() => setSelectedResourceId(resource.id)} resource={resource} selected={selectedResource?.id === resource.id} />
                ))}
              </div>
            ) : (
              <div className="grid h-full place-items-center rounded-company border border-dashed border-base-300 p-8 text-center">
                <div>
                  <i className="ph-bold ph-folder-open text-3xl text-company-muted" aria-hidden="true"></i>
                  <h2 className="mt-3 font-black text-company-ink">{t("assets.noItems")}</h2>
                  <p className="mt-1 text-sm text-company-muted">{t("assets.noItems.detail")}</p>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="overflow-y-auto rounded-company border border-base-300 bg-base-100 p-4 xl:col-span-2 xl:min-h-0 2xl:col-span-1">
          {selectedResource ? (
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-company border border-base-300 bg-base-200 text-company-muted">
                  <i className={`ph-bold ${resourceIcon(selectedResource)}`} aria-hidden="true"></i>
                </span>
                <div className="min-w-0">
                  <h2 className="line-clamp-3 font-black text-company-ink">{selectedResource.name}</h2>
                  <p className="mt-1 text-sm text-company-muted">{resourceType(selectedResource)} · {sourceProvider(selectedResource)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className={`badge badge-sm ${readinessTone(resourceReadiness(selectedResource))}`}>{resourceReadiness(selectedResource).replaceAll("_", " ")}</span>
                <span className="badge badge-outline badge-sm">{selectedResource.organization?.visibility || "workspace"}</span>
                {selectedResource.freshness?.needsCleanup ? <span className="badge badge-warning badge-sm">{t("assets.needsCleanup")}</span> : null}
              </div>

              {resourceSummary(selectedResource) ? <p className="rounded-company border border-base-300 bg-base-200/50 p-3 text-sm leading-6 text-company-muted">{resourceSummary(selectedResource)}</p> : null}

              <dl className="grid gap-3 text-sm">
                <div><dt className="font-bold text-company-muted">{t("table.source")}</dt><dd>{sourceProvider(selectedResource)}</dd></div>
                <div><dt className="font-bold text-company-muted">{t("table.status")}</dt><dd>{selectedResource.organization?.status || selectedResource.freshness?.syncStatus || "-"}</dd></div>
                <div><dt className="font-bold text-company-muted">{t("table.readiness")}</dt><dd>{resourceReadiness(selectedResource).replaceAll("_", " ")}</dd></div>
                <div><dt className="font-bold text-company-muted">{t("assets.modified")}</dt><dd>{formatDate(selectedResource.freshness?.modifiedTime)}</dd></div>
                <div><dt className="font-bold text-company-muted">{t("assets.folder")}</dt><dd>{selectedResource.organization?.folder || "-"}</dd></div>
                <div><dt className="font-bold text-company-muted">{t("assets.knowledgeRoot")}</dt><dd>{selectedResource.organization?.knowledgeRoot || "-"}</dd></div>
              </dl>

              {sourceLink(selectedResource) ? <CcButton href={sourceLink(selectedResource) || undefined} iconLeft="ph-arrow-square-out" rel="noreferrer" target="_blank" variant="primary">{t("assets.open")}</CcButton> : null}
            </div>
          ) : (
            <p className="text-sm text-company-muted">{t("assets.selectResource")}</p>
          )}
        </aside>
      </div>
    </section>
  );
}

export function AssetsRoute() {
  const { t } = useLanguage();
  const activeView = currentAssetsView();
  const packet = useOwnerPacket<AssetsPacket>("/v1/assets/context?areaKey=all&limit=200", true, t);

  return (
    <Shell activeArea="08-zasoby">
      {packet.status === "loading" ? <CcNotice tone="loading" title={t("table.loading.title")} detail={t("table.loading.detail")} /> : null}
      {packet.status === "error" ? <CcNotice tone="error" title={packet.error || t("assets.packetError")} live /> : null}

      {packet.status === "ready" && activeView === "files" && packet.data ? <AssetsFilesView packet={packet.data} /> : null}
      {packet.status === "ready" && activeView === "overview" ? <AssetsOverview packet={packet.data} /> : null}
    </Shell>
  );
}
