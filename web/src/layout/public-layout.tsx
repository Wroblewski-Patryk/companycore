import React from "react";
import { CcButton } from "../components/cc-button";
import { LanguageSelector } from "../i18n/language-selector";
import { useLanguage } from "../i18n/i18n";

export function PublicLayout({
  active,
  children
}: {
  active: "home" | "login" | "register";
  children: React.ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-base-100 text-base-content" data-theme="roost">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-base-100/82 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <a className="flex items-center gap-3 font-black no-underline text-base-content" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-base-200 text-primary shadow-[0_0_28px_rgb(99_102_241_/_0.16)]">
              <span className="text-sm font-bold">R</span>
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base tracking-[0.18em]">{t("app.name")}</span>
              <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-company-muted">{t("app.operatingSystem")}</span>
            </span>
          </a>
          <nav className="flex flex-wrap items-end gap-2">
            <CcButton href="/auth/login" size="sm" variant={active === "login" ? "primary" : "ghost"}>{t("nav.signIn")}</CcButton>
            <CcButton href="/auth/register" size="sm" variant={active === "register" ? "primary" : "outline"}>{t("nav.createAccount")}</CcButton>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-white/10 bg-base-100 px-4 py-7">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-company-muted">
            <span>{t("footer.copy")}</span>
            <span>{t("footer.madeWith")}</span>
            <span className="text-primary" aria-label={t("footer.heartLabel")} role="img">♥</span>
            <span>{t("footer.by")}</span>
            <a className="font-semibold text-base-content underline decoration-primary/45 underline-offset-4 hover:text-primary" href="https://luckysparrow.ch" rel="noreferrer" target="_blank">
              luckysparrow.ch
            </a>
          </div>
          <LanguageSelector compact />
        </div>
      </footer>
    </main>
  );
}
