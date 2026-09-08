"use client";

import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import "@lostinseoul/index.css";
import { FooterOverride, LostTopBar } from "@lostinseoul/components";
import { useTranslations } from "next-intl";
import { Footer } from "@lostinseoul/parts/Footer";

export type PolicyType = "privacy" | "terms" | "refund";

const LOST_LEGAL_SECTIONS = {
  privacy: ["scope", "data", "use", "sharing", "rights", "contact"],
  terms: ["service", "orders", "payment", "limits", "changes", "contact"],
  refund: ["window", "custom", "shipping", "process", "exceptions", "contact"]
} as const satisfies Record<PolicyType, readonly string[]>;

const LOST_LEGAL_RELATED = {
  privacy: ["terms", "refund"],
  terms: ["privacy", "refund"],
  refund: ["terms", "privacy"]
} as const satisfies Record<PolicyType, readonly PolicyType[]>;

export function PolicyContent({ kind }: { kind: PolicyType }) {
  const t = useTranslations("LOSTINSEOUL");
  const pageT = useTranslations(`LOSTINSEOUL.legal.pages.${kind}`);
  const sections = LOST_LEGAL_SECTIONS[kind];

  return (
    <RPage slug={["lostinseoul", kind]} theme="dark" type="pages">
      <FooterOverride />
      <div className="lost-legal-root min-h-screen selection:bg-foreground selection:text-background">
        <header className="px-4 pt-4 md:px-14 md:pt-8">
          <LostTopBar pale />
          <div className="grid min-h-24 grid-cols-[1fr_auto_1fr] items-center gap-4 border-x border-foreground/15 px-4 md:min-h-32 md:px-6">
            <Link
              className="justify-self-start font-sans text-[0.8rem] leading-none font-bold tracking-[0.22em] text-foreground/70 uppercase transition hover:text-foreground"
              href="/lostinseoul"
            >
              {t("legal.backToShop")}
            </Link>
            <Link
              aria-label="LOSTINSEOUL"
              className="font-sans text-[1.05rem] leading-none font-bold tracking-[0.38em] uppercase md:text-[1.35rem]"
              href="/lostinseoul"
            >
              LOSTINSEOUL
            </Link>
            <p className="justify-self-end font-sans text-[0.72rem] leading-none font-bold tracking-[0.18em] text-foreground/45 uppercase md:text-[0.8rem]">
              {t("legal.eyebrow")}
            </p>
          </div>
          <LostTopBar pale reverse />
        </header>

        <main className="mx-auto grid max-w-[120rem] gap-14 px-4 py-20 md:grid-cols-[minmax(18rem,0.35fr)_minmax(0,1fr)] md:px-14 md:py-28 xl:gap-24">
          <aside className="md:sticky md:top-12 md:h-fit">
            <p className="font-sans text-[0.75rem] font-bold tracking-[0.2em] text-foreground/45 uppercase">
              {pageT("lastUpdatedLabel")} {pageT("lastUpdated")}
            </p>
            <nav
              aria-label={t("legal.contents")}
              className="mt-10 grid gap-4 font-sans text-[0.78rem] font-bold tracking-[0.14em] text-foreground/55 uppercase"
            >
              {sections.map((section) => (
                <a
                  className="transition hover:text-foreground"
                  href={`#${section}`}
                  key={section}
                >
                  {pageT(`sections.${section}.title`)}
                </a>
              ))}
            </nav>
          </aside>

          <article className="min-w-0">
            <p className="font-sans text-[0.82rem] font-bold tracking-[0.24em] text-foreground/50 uppercase">
              {pageT("eyebrow")}
            </p>
            <h1 className="mt-6 max-w-[14ch] text-[clamp(4rem,10vw,12rem)] leading-[0.84] font-medium tracking-tight">
              {pageT("title")}
            </h1>
            <p className="mt-10 max-w-[54rem] text-[1.35rem] leading-snug text-foreground/70 md:text-[2rem]">
              {pageT("lede")}
            </p>

            <div className="mt-20 grid gap-12 border-t border-foreground/15 pt-12">
              {sections.map((section) => (
                <section
                  className="grid gap-4 md:grid-cols-[minmax(10rem,0.28fr)_minmax(0,1fr)] md:gap-10"
                  id={section}
                  key={section}
                >
                  <h2 className="font-sans text-[0.84rem] leading-snug font-bold tracking-[0.18em] text-foreground/70 uppercase">
                    {pageT(`sections.${section}.title`)}
                  </h2>
                  <p className="max-w-[66rem] text-[1.08rem] leading-relaxed text-foreground/75 md:text-[1.2rem]">
                    {pageT(`sections.${section}.body`)}
                  </p>
                </section>
              ))}
            </div>

            <nav
              aria-label={t("legal.relatedLabel")}
              className="mt-20 flex flex-wrap gap-3 border-t border-foreground/15 pt-8"
            >
              {LOST_LEGAL_RELATED[kind].map((relatedKind) => (
                <Link
                  className="inline-flex min-h-12 items-center rounded-[4px] border border-foreground/15 px-4 font-sans text-[0.78rem] font-bold tracking-[0.16em] text-foreground/75 uppercase transition hover:bg-foreground hover:text-background"
                  href={`/lostinseoul/${relatedKind}`}
                  key={relatedKind}
                >
                  {t(`legal.related.${relatedKind}`)}
                </Link>
              ))}
            </nav>
          </article>
        </main>

        <Footer />
      </div>
    </RPage>
  );
}
