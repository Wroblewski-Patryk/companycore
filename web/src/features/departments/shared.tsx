import { CcNotice } from "../../components/cc-notice";
import { useLanguage } from "../../i18n/i18n";

export function SummaryGrid({ summary }: { summary?: Record<string, unknown> }) {
  const entries = Object.entries(summary || {})
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .slice(0, 6);
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

export function BlockedActions({ actions }: { actions?: Array<string | { action?: string; reason?: string }> }) {
  const { t } = useLanguage();
  if (!actions?.length) {
    return null;
  }

  return (
    <section className="rounded-company border border-warning/35 bg-warning/10 p-4">
      <h2 className="text-sm font-black uppercase text-company-ink">{t("state.blockedActions")}</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <div className="rounded-company border border-warning/30 bg-base-100/70 p-3 text-sm" key={typeof action === "string" ? action : action.action}>
            <strong className="block text-company-ink">{typeof action === "string" ? action : action.action}</strong>
            {typeof action === "string" ? null : <span className="text-company-muted">{action.reason}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function useTranslatedTableLabels() {
  const { t } = useLanguage();
  return {
    loadingTitle: t("table.loading.title"),
    loadingDetail: t("table.loading.detail"),
    errorTitle: t("table.error.title"),
    actions: t("table.actions"),
    previous: t("table.previous"),
    next: t("table.next"),
    pagination: ({ start, end, total }: { start: number; end: number; total: number }) => (
      t("table.pagination", { start, end, total })
    )
  };
}

export function PacketErrorNotice({ detail }: { detail: string }) {
  return <CcNotice tone="error" title={detail} live />;
}
