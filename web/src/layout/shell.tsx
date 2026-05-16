import React, { useState } from "react";
import { canonicalGeneralDashboardPath } from "../app-route-registry";
import { clearOwnerToken } from "../api/auth-token";
import { CcButton } from "../components/cc-button";
import { LanguageSelector } from "../i18n/language-selector";
import { useLanguage } from "../i18n/i18n";
import { CoreAreaKey } from "../types";
import { coreAreas } from "../features/departments/core-area-data";

function DepartmentSidebar({
  activeArea
}: {
  activeArea?: CoreAreaKey;
}) {
  const { t } = useLanguage();
  const [openAreas, setOpenAreas] = useState<Partial<Record<CoreAreaKey, boolean>>>({
    "00-ogolny": activeArea === "00-ogolny",
    "04-operacje": activeArea === "04-operacje",
    "08-zasoby": activeArea === "08-zasoby"
  });

  return (
    <nav className="mt-5 grid gap-1" aria-label={t("sidebar.departments")}>
      <p className="px-3 text-xs font-black uppercase tracking-wide text-neutral-content/55">{t("sidebar.departments")}</p>
      {coreAreas.map((area) => {
        const isActive = activeArea === area.key;
        const isEnabled = area.enabled !== false && Boolean(area.href);
        const enabledViews = area.views?.filter((view) => view.enabled !== false && view.href) || [];
        const hasExpandableViews = isEnabled && Boolean(area.views && area.views.length > 1);
        const isOpen = Boolean(openAreas[area.key]);
        const label = t(area.labelKey);

        return (
          <div className="grid gap-1" key={area.key}>
            <div className={[
              "grid grid-cols-[minmax(0,1fr)_2.25rem] items-stretch rounded-company",
              isActive ? "bg-primary text-primary-content" : "",
              !isActive && isEnabled ? "text-neutral-content/80 hover:bg-white/10 hover:text-neutral-content" : "",
              !isEnabled ? "text-neutral-content/35" : ""
            ].filter(Boolean).join(" ")}>
              {isEnabled ? (
                <a
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-l-company px-3 py-2.5 text-sm no-underline"
                  href={area.href}
                  title={t("sidebar.openMain")}
                >
                  <i className={`ph-bold ${area.icon} mt-1`} aria-hidden="true"></i>
                  <span className="min-w-0">
                    <strong className="block truncate">{label}</strong>
                    <small className={isActive ? "text-primary-content/75" : "text-neutral-content/55"}>{t(area.eyebrowKey)}</small>
                  </span>
                </a>
              ) : (
                <div
                  aria-disabled="true"
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-company px-3 py-2.5 text-sm"
                  title={t("sidebar.planned")}
                >
                  <i className={`ph-bold ${area.icon} mt-1`} aria-hidden="true"></i>
                  <span className="min-w-0">
                    <strong className="block truncate">{label}</strong>
                    <small>{t(area.eyebrowKey)}</small>
                  </span>
                </div>
              )}

              {hasExpandableViews ? (
                <button
                  aria-expanded={isOpen}
                  aria-label={t(isOpen ? "sidebar.collapse" : "sidebar.expand", { department: label })}
                  className={[
                    "grid place-items-center rounded-r-company text-sm transition",
                    isActive ? "text-primary-content hover:bg-black/10" : "text-neutral-content/65 hover:bg-white/10 hover:text-neutral-content"
                  ].join(" ")}
                  onClick={() => setOpenAreas((current) => ({ ...current, [area.key]: !current[area.key] }))}
                  type="button"
                >
                  <i className={`ph-bold ${isOpen ? "ph-caret-up" : "ph-caret-down"}`} aria-hidden="true"></i>
                </button>
              ) : (
                <span aria-hidden="true"></span>
              )}
            </div>

            {hasExpandableViews && isOpen ? (
              <div className="ml-8 grid gap-1 border-l border-neutral-content/10 pl-2">
                {area.views?.map((view) => {
                  const viewEnabled = view.enabled !== false && Boolean(view.href);
                  const viewActive = isActive && enabledViews.some((enabledView) => enabledView.key === view.key);
                  return viewEnabled ? (
                    <a
                      className={`rounded-company px-3 py-2 text-xs font-bold no-underline ${viewActive ? "bg-white/15 text-neutral-content" : "text-neutral-content/65 hover:bg-white/10 hover:text-neutral-content"}`}
                      href={view.href}
                      key={view.key}
                    >
                      {t(view.labelKey)}
                    </a>
                  ) : (
                    <span
                      className="rounded-company px-3 py-2 text-xs font-bold text-neutral-content/35"
                      key={view.key}
                      title={t("sidebar.viewDisabled")}
                    >
                      {t(view.labelKey)}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function Shell({
  children,
  activeArea
}: {
  children: React.ReactNode;
  activeArea?: CoreAreaKey;
}) {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-base-200 text-base-content" data-theme="companycore">
      <div className="grid min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden max-h-screen overflow-y-auto border-r border-base-300 bg-neutral p-4 text-neutral-content lg:block">
          <a className="flex items-center gap-3 no-underline text-neutral-content" href={canonicalGeneralDashboardPath}>
            <span className="grid h-10 w-10 place-items-center rounded-company bg-primary font-black">CC</span>
            <span>
              <strong className="block">{t("app.name")}</strong>
              <small className="text-neutral-content/65">{t("app.operatingSystem")}</small>
            </span>
          </a>
          <label className="mt-6 grid gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-neutral-content/55">{t("workspace.label")}</span>
            <select className="select select-sm w-full border-neutral-content/15 bg-neutral-content/10 text-neutral-content" aria-label={t("workspace.label")}>
              <option>{t("workspace.current")}</option>
            </select>
          </label>
          <DepartmentSidebar activeArea={activeArea} />
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <a className="flex items-center gap-2 font-black no-underline text-company-ink lg:hidden" href={canonicalGeneralDashboardPath}>
                <span className="grid h-9 w-9 place-items-center rounded-company bg-neutral text-neutral-content">CC</span>
                <span>{t("app.name")}</span>
              </a>
              <nav className="flex flex-wrap gap-2" aria-label={t("sidebar.departments")}>
                {coreAreas.filter((area) => area.enabled !== false && area.href).map((area) => (
                  <CcButton
                    href={area.href || canonicalGeneralDashboardPath}
                    key={area.key}
                    size="sm"
                    variant={activeArea === area.key ? "primary" : "ghost"}
                  >
                    {t(area.labelKey)}
                  </CcButton>
                ))}
              </nav>
              <div className="flex flex-wrap items-end gap-2">
                <LanguageSelector compact />
                <CcButton
                  onClick={() => {
                    clearOwnerToken();
                    window.location.assign("/");
                  }}
                  size="sm"
                  variant="outline"
                >
                  {t("nav.signOut")}
                </CcButton>
              </div>
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
