import { currentUser } from "@/lib/auth/context/get-context-props";
import { SettingsRail, SettingsRailMobile } from "@/components/UX/Settings";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { RPage } from "@/components/UX/Transition";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Hideaway account."
};

export default async function SettingsLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings/profile");

  return (
    <div className="relative isolate flex min-h-screen w-full flex-col bg-background px-20 py-20 text-foreground">
      {/* Atmospheric backdrop: radial fall-off + grain. Bumped from initial
          values that read as flat-black; still well below the legibility
          floor (atmospheric only, no informative content). */}
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(from_var(--foreground)_l_c_h/0.08),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(from_var(--foreground)_l_c_h/0.12),_transparent_50%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[url('/assets/noise.png')] bg-[length:45px_45px] opacity-[0.05] mix-blend-overlay dark:opacity-[0.07]"
      />

      <header className="sticky top-30 z-20 overflow-hidden border-b border-border/30 bg-background/70 backdrop-blur-xl">
        {/* Inner top sheen */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent dark:via-foreground/40"
        />
        <div className="mx-auto px-6 py-5 xl:px-10">
          <div className="flex items-end justify-between gap-6">
            <div className="flex flex-col gap-0.5">
              <p className="font-sans text-sm tracking-widest text-foreground/60 uppercase">
                Your Account
              </p>
              <h1 className="text-2xl font-light tracking-tight xl:text-3xl">
                Settings
              </h1>
            </div>
            {/* Right slot intentionally left empty — the global header avatar
                already identifies the signed-in user. Reserved for a future
                "Last saved · 2m ago" indicator once we have a save bus. */}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full px-6 xl:px-10">
        <SettingsRailMobile />
      </div>

      <div className="relative mx-auto flex w-full flex-1 px-6 xl:px-10">
        <aside className="sticky top-45 hidden w-64 shrink-0 self-start py-12 xl:block 2xl:w-72">
          <SettingsRail />
        </aside>

        <main className="min-w-0 flex-1 py-10 xl:py-12 xl:pl-12 2xl:pl-16">
          {children}
        </main>
      </div>
    </div>
  );
}
