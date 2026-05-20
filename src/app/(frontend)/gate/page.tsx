import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "The Hideaway — Returning soon",
  description: "An editorial house in private rehearsal. Opening in stages.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-static";

export default async function GatePage() {
  const t = await getTranslations("Gate");

  return (
    <div
      data-gate
      className="fixed inset-0 z-[200] flex flex-col bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 80% at 50% 10%, rgba(255,255,255,0.04), transparent 60%), radial-gradient(80% 60% at 50% 110%, rgba(255,255,255,0.025), transparent 60%)"
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
        }}
      />

      <header className="relative flex items-center justify-between px-6 pt-7 xl:px-10 xl:pt-9">
        <span className="font-mono text-[10px] tracking-[0.22em] text-foreground/55 uppercase xl:text-[11px]">
          {t("eyebrow")}
        </span>
        <span className="font-mono text-[10px] tracking-[0.22em] text-foreground/45 uppercase xl:text-[11px]">
          MMXXVI
        </span>
      </header>

      <main className="relative flex flex-1 flex-col items-start justify-center px-6 xl:px-10">
        <div className="max-w-3xl">
          <p className="mb-6 font-mono text-[11px] tracking-[0.28em] text-foreground/55 uppercase">
            {t("wordmark")}
          </p>
          <h1 className="font-serif text-6xl leading-[0.95] font-light tracking-tight md:text-7xl 2xl:text-8xl">
            {t("title")}
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed font-light text-foreground/75 xl:text-lg">
            {t("lede")}
          </p>
          <p className="mt-3 max-w-xl font-mono text-[11px] tracking-widest text-foreground/55 uppercase">
            {t("footnote")}
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Link
              href={t("ctaPrimaryHref")}
              className="border border-foreground/70 bg-foreground px-5 py-2.5 font-mono text-[11px] tracking-widest text-background uppercase transition-colors hover:bg-foreground/90"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href={t("ctaSecondaryHref")}
              className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative flex items-center justify-between border-t border-border/15 px-6 py-5 xl:px-10">
        <span className="font-mono text-[10px] tracking-[0.22em] text-foreground/45 uppercase xl:text-[11px]">
          {t("colophon")}
        </span>
        <span
          aria-hidden
          className="font-mono text-[10px] tracking-[0.22em] text-foreground/35 uppercase xl:text-[11px]"
        >
          ◫
        </span>
      </footer>
    </div>
  );
}
