import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { RPage } from "@/components/UX/Transition";

import "../index.css";

type SearchParams = Promise<{
  error?: string | string[];
  returnTo?: string | string[];
}>;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function safeReturnTo(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/api/")) return "/";

  return value;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LOSTINSEOUL.gate");

  return {
    description: t("metaDescription"),
    title: t("metaTitle")
  };
}

export default async function LostGatePage(props: {
  searchParams?: SearchParams;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const returnTo = safeReturnTo(firstParam(searchParams.returnTo));
  const hasError = firstParam(searchParams.error) === "invalid";
  const t = await getTranslations("LOSTINSEOUL.gate");
  const footer = t("footer");

  return (
    <RPage slug={["lostinseoul", "gate"]} theme={null} type="pages">
      <main className="lost-standalone-root lost-gate-root relative min-h-[100svh] overflow-hidden bg-background text-foreground selection:bg-foreground selection:text-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:5rem_5rem] opacity-[0.035] md:[background-size:8rem_8rem]"
        />
        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[100rem] flex-col px-5 sm:px-8 lg:px-12">
          <header className="grid min-h-20 grid-cols-[1fr_auto_1fr] items-center border-b border-foreground/15 font-mono text-[0.64rem] font-medium tracking-[0.2em] uppercase sm:min-h-24 sm:text-[0.7rem]">
            <span className="text-foreground/55">{t("eyebrow")}</span>
            <span className="text-xs font-semibold tracking-[0.36em] sm:text-sm">
              LOSTINSEOUL
            </span>
            <span className="justify-self-end text-foreground/55">
              {t("status")}
            </span>
          </header>

          <section className="grid flex-1 content-end gap-14 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] lg:items-end lg:gap-24 lg:py-16">
            <div className="max-w-3xl">
              <p className="font-mono text-[0.68rem] font-medium tracking-[0.22em] text-foreground/55 uppercase">
                01 / {t("label")}
              </p>
              <p className="mt-5 max-w-[11ch] text-[clamp(3.25rem,8.8vw,8.5rem)] leading-[0.86] font-light tracking-[-0.06em]">
                {t("lede")}
              </p>
            </div>

            <form
              action="/api/lost/gate"
              className="grid w-full gap-6 border-t border-foreground/20 pt-6 lg:justify-self-end"
              method="post"
            >
              <input name="returnTo" type="hidden" value={returnTo} />
              <div className="flex items-center justify-between font-mono text-[0.64rem] font-medium tracking-[0.18em] text-foreground/55 uppercase">
                <span>{t("passwordLabel")}</span>
                <span aria-hidden>01—01</span>
              </div>
              <label className="sr-only" htmlFor="lost-gate-password">
                {t("passwordLabel")}
              </label>
              <div className="grid grid-cols-[1fr_auto] border-b border-foreground/35 transition-colors focus-within:border-foreground">
                <input
                  autoComplete="current-password"
                  autoFocus
                  className="h-16 min-w-0 bg-transparent pr-4 text-xl font-light tracking-tight outline-none placeholder:text-foreground/30 sm:text-2xl"
                  id="lost-gate-password"
                  name="password"
                  placeholder={t("passwordPlaceholder")}
                  required
                  type="password"
                />
                <button
                  className="group inline-flex min-h-12 min-w-24 items-center justify-end gap-3 font-mono text-[0.68rem] font-semibold tracking-[0.18em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                  type="submit"
                >
                  <span>{t("submit")}</span>
                  <span
                    aria-hidden
                    className="text-base transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>
              </div>
              <p
                aria-live="polite"
                className="min-h-5 font-mono text-[0.66rem] font-medium tracking-[0.12em] text-foreground/60 uppercase"
              >
                {hasError ? t("invalid") : ""}
              </p>
            </form>
          </section>

          <footer className="flex min-h-16 items-center justify-between border-t border-foreground/15 font-mono text-[0.6rem] tracking-[0.18em] text-foreground/45 uppercase sm:min-h-20">
            <span>{footer}</span>
            <span aria-hidden>SEOUL · 2026</span>
          </footer>
        </div>
      </main>
    </RPage>
  );
}
