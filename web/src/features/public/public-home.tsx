import { CcButton } from "../../components/cc-button";
import { useLanguage } from "../../i18n/i18n";
import type { MessageKey } from "../../i18n/messages";
import { PublicLayout } from "../../layout/public-layout";

const systemNodes = [
  { key: "people", icon: "ph-users-three", className: "left-[9%] top-[16%]" },
  { key: "agents", icon: "ph-sparkle", className: "right-[12%] top-[19%]" },
  { key: "processes", icon: "ph-flow-arrow", className: "left-[17%] bottom-[22%]" },
  { key: "assets", icon: "ph-database", className: "right-[18%] bottom-[18%]" }
] as const;

const capabilityKeys = ["control", "organization", "automation"] as const;
const signalKeys = ["human", "api", "memory"] as const;

function RoostMark({ large = false }: { large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "relative grid shrink-0 place-items-center rounded-2xl border border-white/10 bg-base-200/80 shadow-[0_0_34px_rgb(99_102_241_/_0.18)]",
        large ? "h-16 w-16" : "h-11 w-11"
      ].join(" ")}
    >
      <span className="absolute inset-2 rounded-full border border-primary/45"></span>
      <span className="absolute h-[42%] w-[58%] rounded-[999px_999px_999px_260px] border border-accent/70"></span>
      <span className="absolute h-[1px] w-[58%] rotate-[-24deg] bg-gradient-to-r from-primary to-accent"></span>
      <span className="font-heading text-sm font-bold text-base-content">{large ? "R" : ""}</span>
    </span>
  );
}

function TopologyPreview() {
  const { t } = useLanguage();
  const tx = (key: string) => t(key as MessageKey);

  return (
    <div className="relative min-h-[31rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-base-200/70 p-5 shadow-roost-soft backdrop-blur-xl sm:min-h-[28rem]">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgb(255_255_255_/_0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.045)_1px,transparent_1px)] [background-size:44px_44px]"></div>
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/25"></div>
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15"></div>
      <div className="absolute left-1/2 top-1/2 h-[1px] w-[78%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent"></div>
      <div className="absolute left-1/2 top-1/2 h-[70%] w-[1px] -translate-y-1/2 bg-gradient-to-b from-transparent via-accent/45 to-transparent"></div>

      <div className="relative z-10 flex h-full min-h-[18rem] items-center justify-center sm:min-h-[25rem]">
        <div className="relative grid h-44 w-44 place-items-center rounded-full border border-white/12 bg-base-100/78 shadow-[0_0_70px_rgb(99_102_241_/_0.18)]">
          <div className="absolute inset-5 rounded-full border border-primary/30"></div>
          <RoostMark large />
          <div className="mt-28 hidden text-center sm:block">
            <p className="roost-label text-[0.62rem]">{t("home.topology.coreLabel")}</p>
            <p className="mt-1 text-sm font-semibold text-base-content">{t("home.topology.core")}</p>
          </div>
        </div>
      </div>

      {systemNodes.map((node) => (
        <div
          className={`absolute z-20 hidden max-w-[9.5rem] rounded-2xl border border-white/10 bg-base-100/80 p-3 shadow-[0_16px_34px_rgb(0_0_0_/_0.22)] backdrop-blur sm:block ${node.className}`}
          key={node.key}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <i className={`ph-bold ${node.icon}`} aria-hidden="true"></i>
            </span>
            <span className="text-sm font-semibold text-base-content">{tx(`home.node.${node.key}`)}</span>
          </div>
        </div>
      ))}

      <div className="absolute bottom-32 left-4 right-4 z-20 grid grid-cols-2 gap-2 sm:hidden">
        {systemNodes.map((node) => (
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-base-100/82 p-3 backdrop-blur" key={node.key}>
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <i className={`ph-bold ${node.icon}`} aria-hidden="true"></i>
            </span>
            <span className="text-sm font-semibold text-base-content">{tx(`home.node.${node.key}`)}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-20 grid gap-2 rounded-2xl border border-white/10 bg-base-100/75 p-3 backdrop-blur md:grid-cols-3">
        {signalKeys.map((key) => (
          <div className="flex items-center gap-2 text-xs text-company-muted" key={key}>
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_16px_rgb(6_182_212_/_0.45)]"></span>
            <span>{tx(`home.signal.${key}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicHomeRoute() {
  const { t } = useLanguage();
  const tx = (key: string) => t(key as MessageKey);

  return (
    <PublicLayout active="home">
      <section className="relative isolate overflow-hidden px-4 py-10 sm:py-14 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_20%,rgb(99_102_241_/_0.16),transparent_28%),radial-gradient(circle_at_78%_14%,rgb(6_182_212_/_0.12),transparent_28%),linear-gradient(180deg,#0d1117_0%,#10151d_54%,#0d1117_100%)]"></div>
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl content-center gap-10 lg:min-h-[680px] lg:grid-cols-[minmax(0,0.9fr)_minmax(25rem,1fr)] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-7 flex items-center gap-4">
              <RoostMark />
              <div>
                <p className="roost-label">{t("app.operatingSystem")}</p>
                <p className="mt-1 text-sm text-company-muted">{t("home.brandLine")}</p>
              </div>
            </div>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] text-base-content sm:text-6xl lg:text-7xl">
              {t("home.title")} <span className="roost-gradient-text">{t("home.titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-company-muted">{t("home.description")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CcButton href="/auth/login" iconRight="ph-arrow-right" size="lg" variant="primary">{t("home.openWorkspace")}</CcButton>
              <CcButton href="/auth/register" size="lg" variant="outline">{t("home.createWorkspace")}</CcButton>
            </div>
          </div>

          <TopologyPreview />
        </div>

        <div className="mx-auto grid max-w-7xl gap-3 pt-6 md:grid-cols-3">
          {capabilityKeys.map((key) => (
            <article className="rounded-2xl border border-white/10 bg-base-200/50 p-5 backdrop-blur" key={key}>
              <p className="roost-label">{tx(`home.capability.${key}.label`)}</p>
              <h2 className="mt-3 text-xl font-semibold text-base-content">{tx(`home.capability.${key}.title`)}</h2>
              <p className="mt-2 text-sm leading-6 text-company-muted">{tx(`home.capability.${key}.description`)}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
