import { getTranslations } from "next-intl/server";
import { AuthView as AuthCard } from "@/lib/external/betterauth-ui/src";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { signInRedirectTarget } from "@/lib/routes/auth";
import "../../index.css";
import { lostSignInMetadata } from "./metadata";

export const metadata = lostSignInMetadata;

type SearchParams = Promise<{
  redirectTo?: string | string[];
  redirect?: string | string[];
  callbackUrl?: string | string[];
  next?: string | string[];
}>;

export default async function LostSignInPage(props: {
  searchParams?: SearchParams;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const redirectTo = signInRedirectTarget(searchParams);
  const t = await getTranslations("LOSTINSEOUL");

  return (
    <RPage slug={["lostinseoul", "auth", "sign-in"]} type="account">
      <main className="lost-standalone-root grid min-h-[100svh] bg-[var(--n-s-bg)] px-5 py-7 text-[var(--n-s-fg)] md:px-10 md:py-12">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-12">
          <section className="max-w-2xl">
            <Link
              href="/lostinseoul"
              className="font-mono text-xs tracking-[0.2em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.68)] uppercase transition-opacity hover:opacity-75"
            >
              {t("home.eyebrow")}
            </Link>
            <h1 className="mt-5 font-serif text-4xl font-bold tracking-tight md:text-6xl xl:text-7xl">
              {t("home.title")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.7)] md:text-base">
              {t("home.lede")}
            </p>
          </section>

          <section className="border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.18)] bg-[oklch(from_var(--n-s-bg)_l_c_h_/_0.76)] p-5 backdrop-blur-xl md:p-7">
            <AuthCard view="SIGN_IN" redirectTo={redirectTo} />
          </section>
        </div>
      </main>
    </RPage>
  );
}
