import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { getLostBusinessFooterProps } from "./business-footer-props";
import { LostFooter, LostTopBar } from "./components";
import "./index.css";

export type LostLegalPageKind = "privacy" | "terms" | "refund";

const LOST_LEGAL_SECTIONS = {
  privacy: ["scope", "data", "use", "sharing", "rights", "contact"],
  terms: ["service", "orders", "payment", "limits", "changes", "contact"],
  refund: ["window", "custom", "shipping", "process", "exceptions", "contact"]
} as const satisfies Record<LostLegalPageKind, readonly string[]>;

const LOST_LEGAL_RELATED = {
  privacy: ["terms", "refund"],
  terms: ["privacy", "refund"],
  refund: ["terms", "privacy"]
} as const satisfies Record<LostLegalPageKind, readonly LostLegalPageKind[]>;

export async function generateLostLegalMetadata(
  kind: LostLegalPageKind
): Promise<Metadata> {
  const t = await getTranslations(`LOSTINSEOUL.legal.pages.${kind}`);

  return {
    title: t("metaTitle"),
    description: t("metaDescription")
  };
}

export async function LostLegalPage({ kind }: { kind: LostLegalPageKind }) {
  const [t, pageT, legalT] = await Promise.all([
    getTranslations("LOSTINSEOUL"),
    getTranslations(`LOSTINSEOUL.legal.pages.${kind}`),
    getTranslations("LOSTINSEOUL.legal")
  ]);
  const sections = LOST_LEGAL_SECTIONS[kind];

  return (
    <RPage slug={["lostinseoul", kind]} type="pages">
      <div className="lost-legal-root min-h-screen bg-[var(--black)] text-[var(--white)] selection:bg-[var(--white)] selection:text-[var(--black)]">
        <header className="px-4 pt-4 md:px-14 md:pt-8">
          <LostTopBar pale />
          <div className="grid min-h-24 grid-cols-[1fr_auto_1fr] items-center gap-4 border-x border-[oklch(from_var(--white)_l_c_h_/_0.15)] px-4 md:min-h-32 md:px-6">
            <Link
              className="justify-self-start font-mono text-[0.8rem] leading-none font-bold tracking-[0.22em] text-[oklch(from_var(--white)_l_c_h_/_0.68)] uppercase transition hover:text-[var(--white)]"
              href="/"
            >
              {legalT("backToShop")}
            </Link>
            <Link
              aria-label="LOSTINSEOUL"
              className="font-mono text-[1.05rem] leading-none font-bold tracking-[0.38em] uppercase md:text-[1.35rem]"
              href="/"
            >
              LOSTINSEOUL
            </Link>
            <p className="justify-self-end font-mono text-[0.72rem] leading-none font-bold tracking-[0.18em] text-[oklch(from_var(--white)_l_c_h_/_0.45)] uppercase md:text-[0.8rem]">
              {legalT("eyebrow")}
            </p>
          </div>
          <LostTopBar pale reverse />
        </header>

        <main className="mx-auto grid max-w-[120rem] gap-14 px-4 py-20 md:grid-cols-[minmax(18rem,0.35fr)_minmax(0,1fr)] md:px-14 md:py-28 xl:gap-24">
          <aside className="md:sticky md:top-12 md:h-fit">
            <p className="font-mono text-[0.75rem] font-bold tracking-[0.2em] text-[oklch(from_var(--white)_l_c_h_/_0.48)] uppercase">
              {pageT("lastUpdatedLabel")} {pageT("lastUpdated")}
            </p>
            <nav
              aria-label={legalT("contents")}
              className="mt-10 grid gap-4 font-mono text-[0.78rem] font-bold tracking-[0.14em] text-[oklch(from_var(--white)_l_c_h_/_0.58)] uppercase"
            >
              {sections.map((section) => (
                <a
                  className="transition hover:text-[var(--white)]"
                  href={`#${section}`}
                  key={section}
                >
                  {pageT(`sections.${section}.title`)}
                </a>
              ))}
            </nav>
          </aside>

          <article className="min-w-0">
            <p className="font-mono text-[0.82rem] font-bold tracking-[0.24em] text-[oklch(from_var(--white)_l_c_h_/_0.52)] uppercase">
              {pageT("eyebrow")}
            </p>
            <h1 className="mt-6 max-w-[14ch] text-[clamp(4rem,10vw,12rem)] leading-[0.84] font-medium tracking-tight">
              {pageT("title")}
            </h1>
            <p className="mt-10 max-w-[54rem] text-[1.35rem] leading-snug text-[oklch(from_var(--white)_l_c_h_/_0.72)] md:text-[2rem]">
              {pageT("lede")}
            </p>

            <div className="mt-20 grid gap-12 border-t border-[oklch(from_var(--white)_l_c_h_/_0.16)] pt-12">
              {sections.map((section) => (
                <section
                  className="grid gap-4 md:grid-cols-[minmax(10rem,0.28fr)_minmax(0,1fr)] md:gap-10"
                  id={section}
                  key={section}
                >
                  <h2 className="font-mono text-[0.84rem] leading-snug font-bold tracking-[0.18em] text-[oklch(from_var(--white)_l_c_h_/_0.72)] uppercase">
                    {pageT(`sections.${section}.title`)}
                  </h2>
                  <p className="max-w-[66rem] text-[1.08rem] leading-relaxed text-[oklch(from_var(--white)_l_c_h_/_0.78)] md:text-[1.2rem]">
                    {pageT(`sections.${section}.body`)}
                  </p>
                </section>
              ))}
            </div>

            <nav
              aria-label={legalT("relatedLabel")}
              className="mt-20 flex flex-wrap gap-3 border-t border-[oklch(from_var(--white)_l_c_h_/_0.16)] pt-8"
            >
              {LOST_LEGAL_RELATED[kind].map((relatedKind) => (
                <Link
                  className="inline-flex min-h-12 items-center rounded-[4px] border border-[oklch(from_var(--white)_l_c_h_/_0.18)] px-4 font-mono text-[0.78rem] font-bold tracking-[0.16em] text-[oklch(from_var(--white)_l_c_h_/_0.78)] uppercase transition hover:bg-[var(--white)] hover:text-[var(--black)]"
                  href={`/${relatedKind}`}
                  key={relatedKind}
                >
                  {legalT(`related.${relatedKind}`)}
                </Link>
              ))}
            </nav>
          </article>
        </main>

        <LostFooter
          archiveLabel={t("nav.archive")}
          footerContactLabel={t("footer.contact")}
          footerCopyrightLabel={t("footer.copyright")}
          footerInfoLabel={t("footer.info")}
          footerPrivacyLabel={t("footer.privacy")}
          footerReturnsLabel={t("footer.returns")}
          footerTermsLabel={t("footer.terms")}
          shopLabel={t("nav.shop")}
          {...getLostBusinessFooterProps(t)}
        />
      </div>
    </RPage>
  );
}
