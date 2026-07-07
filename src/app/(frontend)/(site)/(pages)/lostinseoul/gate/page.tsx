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

  return (
    <RPage slug={["lostinseoul", "gate"]} type="pages">
      <main className="lost-standalone-root grid min-h-[100svh] bg-[var(--black)] px-5 py-6 text-[var(--white)] selection:bg-[var(--white)] selection:text-[var(--black)] md:px-14 md:py-10">
        <section className="mx-auto grid w-full max-w-7xl content-between border-x border-[oklch(from_var(--white)_l_c_h_/_0.16)] px-5 py-6 md:min-h-[calc(100svh-5rem)] md:px-10 md:py-8">
          <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-y border-[oklch(from_var(--white)_l_c_h_/_0.16)] py-4">
            <p className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-[oklch(from_var(--white)_l_c_h_/_0.48)] uppercase">
              {t("eyebrow")}
            </p>
            <p className="font-mono text-sm font-bold tracking-[0.34em] uppercase md:text-base">
              LOSTINSEOUL
            </p>
            <p className="justify-self-end font-mono text-[0.7rem] font-bold tracking-[0.2em] text-[oklch(from_var(--white)_l_c_h_/_0.48)] uppercase">
              {t("status")}
            </p>
          </header>

          <div className="grid gap-12 py-20 md:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.45fr)] md:items-end md:py-28">
            <div>
              <p className="font-mono text-[0.8rem] font-bold tracking-[0.24em] text-[oklch(from_var(--white)_l_c_h_/_0.54)] uppercase">
                {t("label")}
              </p>
              <h1 className="mt-6 max-w-[12ch] text-[clamp(4.4rem,12vw,13rem)] leading-[0.82] font-medium tracking-tight">
                {t("title")}
              </h1>
              <p className="mt-8 max-w-2xl text-[1.25rem] leading-snug text-[oklch(from_var(--white)_l_c_h_/_0.72)] md:text-[1.8rem]">
                {t("lede")}
              </p>
            </div>

            <form
              action="/api/lost/gate"
              className="grid gap-5 border-t border-[oklch(from_var(--white)_l_c_h_/_0.18)] pt-6"
              method="post"
            >
              <input name="returnTo" type="hidden" value={returnTo} />
              <label className="grid gap-3">
                <span className="font-mono text-[0.74rem] font-bold tracking-[0.18em] text-[oklch(from_var(--white)_l_c_h_/_0.58)] uppercase">
                  {t("passwordLabel")}
                </span>
                <input
                  autoComplete="current-password"
                  className="h-14 rounded-none border border-[oklch(from_var(--white)_l_c_h_/_0.24)] bg-transparent px-4 font-mono text-base text-[var(--white)] transition outline-none placeholder:text-[oklch(from_var(--white)_l_c_h_/_0.32)] focus:border-[oklch(from_var(--white)_l_c_h_/_0.7)]"
                  name="password"
                  placeholder={t("passwordPlaceholder")}
                  type="password"
                />
              </label>
              {hasError ? (
                <p className="font-mono text-[0.74rem] font-bold tracking-[0.12em] text-[oklch(72%_0.16_28)] uppercase">
                  {t("invalid")}
                </p>
              ) : null}
              <button
                className="min-h-14 border border-[oklch(from_var(--white)_l_c_h_/_0.78)] px-5 font-mono text-[0.78rem] font-bold tracking-[0.18em] uppercase transition hover:bg-[var(--white)] hover:text-[var(--black)]"
                type="submit"
              >
                {t("submit")}
              </button>
            </form>
          </div>

          <footer className="border-y border-[oklch(from_var(--white)_l_c_h_/_0.16)] py-4 font-mono text-[0.7rem] font-bold tracking-[0.18em] text-[oklch(from_var(--white)_l_c_h_/_0.45)] uppercase">
            {t("footer")}
          </footer>
        </section>
      </main>
    </RPage>
  );
}
