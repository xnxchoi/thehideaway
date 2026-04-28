import { RPage } from "@/components/UX/Transition";
import AccountSwitcher from "@/components/UX/account-switch";
import { UserCard } from "@/app/(frontend)/(site)/(auth)/me/account/user-card";
import { Suspense } from "react";
import { PageClient } from "./page.client";

export default async function Page() {
  return (
    <RPage type="account" slug={["prive"]}>
      <PageClient />
      <div className="flex min-h-screen w-full flex-col" data-lenis-prevent>
        <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase xl:text-xs">
                  Your Account
                </p>
                <h1 className="mt-0.5 text-2xl font-light tracking-tight xl:text-3xl">
                  Settings
                </h1>
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl px-6 py-8 xl:px-10 xl:py-12">
          <div className="flex flex-col gap-8">
            <Suspense fallback={null}>
              <AccountSwitcher />
            </Suspense>
            <Suspense fallback={null}>
              <UserCard />
            </Suspense>
          </div>
        </div>
      </div>
    </RPage>
  );
}
