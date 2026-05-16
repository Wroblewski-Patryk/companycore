import { CcButton } from "../../components/cc-button";
import { CcNotice } from "../../components/cc-notice";
import { useOwnerPacket } from "../../hooks/use-owner-packet";
import { useLanguage } from "../../i18n/i18n";
import { Shell } from "../../layout/shell";
import { AuthMe } from "../../types";

function SettingRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-company border border-base-300 bg-base-100 p-4">
      <p className="text-xs font-black uppercase text-company-muted">{label}</p>
      <strong className="mt-1 block break-words text-company-ink">{value || "—"}</strong>
    </div>
  );
}

export function AccountSettingsRoute() {
  const { t } = useLanguage();
  const profile = useOwnerPacket<AuthMe>("/v1/auth/me", true, t);
  const activeWorkspace = profile.data?.workspaces?.find((workspace) => workspace.active);

  return (
    <Shell>
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-primary">{t("user.myAccount")}</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">{t("account.title")}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-company-muted">{t("account.description")}</p>
      </section>
      {profile.status === "error" ? <CcNotice tone="error" title={profile.error || t("errors.request_failed")} live /> : null}
      <section className="grid gap-3 md:grid-cols-2">
        <SettingRow label={t("account.userId")} value={profile.data?.userId} />
        <SettingRow label={t("account.authType")} value={profile.data?.authType} />
        <SettingRow label={t("workspace.label")} value={activeWorkspace?.name} />
        <SettingRow label={t("account.role")} value={activeWorkspace?.role} />
      </section>
    </Shell>
  );
}

export function WorkspaceSettingsRoute() {
  const { t } = useLanguage();
  const profile = useOwnerPacket<AuthMe>("/v1/auth/me", true, t);
  const activeWorkspace = profile.data?.workspaces?.find((workspace) => workspace.active);

  return (
    <Shell>
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <p className="text-sm font-black uppercase text-primary">{t("workspace.settings")}</p>
        <h1 className="mt-2 text-3xl font-black text-company-ink">{t("workspaceSettings.title")}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-company-muted">{t("workspaceSettings.description")}</p>
      </section>
      {profile.status === "error" ? <CcNotice tone="error" title={profile.error || t("errors.request_failed")} live /> : null}
      <section className="grid gap-3 md:grid-cols-2">
        <SettingRow label={t("workspaceSettings.name")} value={activeWorkspace?.name} />
        <SettingRow label={t("workspaceSettings.id")} value={activeWorkspace?.id || profile.data?.workspaceId} />
        <SettingRow label={t("account.role")} value={activeWorkspace?.role} />
        <SettingRow label={t("workspaceSettings.availableWorkspaces")} value={String(profile.data?.workspaces?.length || 0)} />
      </section>
      <section className="rounded-company border border-base-300 bg-base-100 p-5">
        <h2 className="text-xl font-black text-company-ink">{t("workspaceSettings.integrations")}</h2>
        <p className="mt-2 text-company-muted">{t("workspaceSettings.integrationsDescription")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CcButton disabledReason={t("workspaceSettings.nextSlice")} iconLeft="ph-key" variant="outline">{t("workspaceSettings.apiKeys")}</CcButton>
          <CcButton disabledReason={t("workspaceSettings.nextSlice")} iconLeft="ph-plugs-connected" variant="outline">{t("workspaceSettings.integrations")}</CcButton>
        </div>
      </section>
    </Shell>
  );
}
