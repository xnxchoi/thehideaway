"use client";
import { Link } from "@/components/core/Link/Link";
import { ConsentGate } from "@/components/UX/Consent/ConsentGate";
import { VGradientModule } from "@/components/UX/Gradient/Gradient_M";
import { Logo } from "@/components/core/Logo";
import { RPage } from "@/components/UX/Transition";
import { AuthView as AuthCard } from "@/lib/external/betterauth-ui/src";
import { Suspense } from "react";

export default function Page() {
  return (
    <RPage type="account" slug={["sign-up"]}>
      <div className="relative z-[100] flex min-h-svh flex-col items-center justify-center gap-10 p-9 md:p-16">
        <div
          className={
            "absolute inset-[35px] z-[120] flex rounded-[35px] bg-opaque-background/55 backdrop-blur-[54px]"
          }
        ></div>
        <div className="z-[120] flex w-full max-w-[420px] flex-col gap-9">
          <Link
            href="/"
            className="flex items-center gap-3.5 self-center font-medium"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Logo />
            </div>
            The Hideaway.
          </Link>
          <ConsentGate>
            <AuthCard view="SIGN_UP" redirectTo="/me" />
          </ConsentGate>
        </div>
        <Suspense>
          <VGradientModule />
        </Suspense>
      </div>
    </RPage>
  );
}
