import { currentUser } from "@/lib/auth/context/get-context-props";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SettingsRail } from "@/components/UX/Settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Hideaway account."
};

/**
 * Settings shell — macOS × iOS hybrid, two columns at xl+.
 *
 *   - **xl+ (desktop)**: rail on the left + main pane on the right.
 *     Inside the main pane, multi-panel pages use `<PanelBento/>` to
 *     pack panels in a 2-col grid at 2xl, single col below.
 *   - **< xl (tablet / mobile)**: the rail collapses; navigation lives
 *     on the hub page; each sub-route shows a `← Settings` back link.
 *
 * The previous third "companion" column was retired — a sticky identity
 * card on every settings page added vanity chrome without earning the
 * width. The Fey direction is dense adjacent panels, not column-stuffing,
 * so the canvas at wide breakpoints is filled by the bento grid inside
 * the main pane instead.
 *
 * `overflow-x-clip` on the outer wrapper is a localised guardrail for
 * RPage's inner `w-screen` (Transition/index.tsx renders the page surface
 * at viewport width, which would otherwise overflow the constrained main
 * column).
 */
export default async function SettingsLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings");

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-background text-foreground">
      {/* Atmosphere — kept very low. The expensive feel comes from canvas
          uniformity, not from a glow. Decorative-only; no informative
          content lives at these opacities. */}
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(from_var(--foreground)_l_c_h/0.04),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(from_var(--foreground)_l_c_h/0.07),_transparent_55%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[url('/assets/noise.png')] bg-[length:45px_45px] opacity-[0.03] mix-blend-overlay dark:opacity-[0.05]"
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-x-8 px-6 pt-24 pb-20 xl:grid-cols-[224px_minmax(0,1fr)] xl:gap-x-8 xl:px-10 xl:pt-32 2xl:max-w-[1440px] 2xl:gap-x-10 2xl:px-12">
        <aside className="hidden xl:sticky xl:top-32 xl:block xl:self-start">
          <SettingsRail />
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
