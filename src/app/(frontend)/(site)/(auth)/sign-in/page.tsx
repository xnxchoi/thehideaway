import { RPage } from "@/components/UX/Transition";
import { AuthView as AuthCard } from "@betterauth-ui";
import { Link } from "@/components/core/Link/Link";
import { Logo } from "@/components/core/Logo";
import { VGradientModule } from "@/components/UX/Gradient/Gradient_M";
import { Suspense } from "react";
import { DevButlerButton } from "./DevButlerButton";
import { signInRedirectTarget } from "@/lib/routes/auth";

// Server-evaluated. Both flags must be true for the button to be enabled,
// and the button is only mounted at all when NODE_ENV !== "production".
const isDev = process.env.NODE_ENV !== "production";
const butlerEnabled = isDev && Boolean(process.env.DEV_BUTLER_PASSWORD);
const butlerReason = isDev
  ? butlerEnabled
    ? null
    : "Set DEV_BUTLER_PASSWORD"
  : null;

type SearchParams = Promise<{
  redirectTo?: string | string[];
  redirect?: string | string[];
}>;

export default function Page(props: { searchParams?: SearchParams }) {
  return (
    <RPage slug={["sign-in"]} type={"account"}>
      <div className="relative z-[100] flex min-h-svh flex-col items-center justify-center gap-10 p-9 md:p-16">
        <div
          className={
            "absolute inset-[35px] z-[120] flex rounded-[35px] bg-opaque-background/55 backdrop-blur-[54px]"
          }
        ></div>
        <div className="z-[120] flex w-full max-w-[384px] flex-col gap-9">
          <Link
            href="/"
            className="flex items-center gap-3.5 self-center font-medium"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-transparent">
              <Logo />
            </div>
            The Hideaway.
          </Link>
          <Suspense>
            <SignInCard searchParams={props.searchParams} />
          </Suspense>
          {isDev ? (
            <DevButlerButton enabled={butlerEnabled} reason={butlerReason} />
          ) : null}
          <p className="text-center text-xs opacity-40">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:opacity-70">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:opacity-70">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <Suspense>
          <VGradientModule />
        </Suspense>
      </div>
    </RPage>
  );
}

async function SignInCard({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const redirectTo = signInRedirectTarget(params);
  return <AuthCard view="SIGN_IN" redirectTo={redirectTo} />;
}
