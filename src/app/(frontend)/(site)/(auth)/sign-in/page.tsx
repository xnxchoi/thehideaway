import { RPage } from "@/components/UX/Transition";
import { AuthView as AuthCard } from "@/lib/auth/betterauth-ui/src";
import { Link } from "@/components/UX/Link/Link";
import { Logo } from "@/components/UX/Logo";
import { VGradientModule } from "@/components/UX/Gradient/Gradient";

export default function Page() {
  return (
    <RPage slug={["sign-in"]} type={"account"}>
      <div className="relative z-[100] flex min-h-svh flex-col items-center justify-center gap-10 p-9 md:p-16">
        <div
          className={
            "absolute inset-[35px] z-[120] flex rounded-[35px] bg-[oklch(var(--opaque-bg)/.54)] backdrop-blur-[54px]"
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
          <AuthCard view="SIGN_IN" />
        </div>
        <VGradientModule />
      </div>
    </RPage>
  );
}
