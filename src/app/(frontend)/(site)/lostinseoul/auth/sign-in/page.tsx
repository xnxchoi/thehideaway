import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { AuthView as AuthCard } from "@/components/auth";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { DevAuthLabMount } from "@/lib/auth/dev/lab/DevAuthLabMount";
import { signInRedirectTarget } from "@/lib/routes/auth";
import "@lostinseoul/index.css";

export const instant = false;

type SearchParams = Promise<{
  redirectTo?: string | string[];
  redirect?: string | string[];
  callbackUrl?: string | string[];
  next?: string | string[];
}>;

export default async function LostSignInPage(props: {
  searchParams?: SearchParams;
}) {
  await connection();
  const searchParams = props.searchParams ? await props.searchParams : {};
  const redirectTo = signInRedirectTarget(searchParams);
  const t = await getTranslations("LOSTINSEOUL");

  return (
    <RPage slug={["lostinseoul", "auth", "sign-in"]} type="account">
      <main className="lost-standalone-root grid min-h-[100svh] bg-[var(--n-s-bg)] px-5 py-8 text-[var(--n-s-fg)] md:px-10">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <section className="max-w-2xl">
            <Link
              href="/lostinseoul"
              className="font-sans text-xs tracking-[0.2em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.65)] uppercase transition-opacity hover:opacity-75"
            >
              {t("home.eyebrow")}
            </Link>
            <h1 className="mt-6 font-serif text-6xl font-bold tracking-tight md:text-7xl">
              {t("home.title")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.68)] md:text-lg">
              {t("home.lede")}
            </p>
          </section>

          <section className="border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.16)] bg-[oklch(from_var(--n-s-bg)_l_c_h_/_0.72)] p-5 backdrop-blur-xl md:p-7">
            <AuthCard view="SIGN_IN" redirectTo={redirectTo} />
            {process.env.NODE_ENV !== "production" ? (
              <div className="mt-6">
                <DevAuthLabMount />
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </RPage>
  );
}
