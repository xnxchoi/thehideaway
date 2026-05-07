import { currentUser } from "@/lib/auth/context/get-context-props";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SETTINGS_SECTIONS } from "@/components/UX/Settings/sections";
import {
  TableOfContents,
  TableOfContentsMobile
} from "@/components/UX/TableOfContents";
import type { TocRouteItem } from "@/components/UX/TableOfContents";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Hideaway account."
};

const SETTINGS_BASE = "/me/settings";

const TOC_ITEMS: TocRouteItem[] = SETTINGS_SECTIONS.map((s) => ({
  href: `${SETTINGS_BASE}/${s.slug}`,
  label: s.label,
  number: s.number
}));

/**
 * Settings shell.
 *
 * NOTE on RPage placement: each page.client.tsx wraps its body in <RPage> —
 * not this layout. Hoisting RPage up here puts it inside the outer mask
 * chrome and the motion variants get stuck at opacity:0 because the
 * transition machinery expects RPage at the route-leaf level. Layout-level
 * RPage is a desirable architectural goal, but it requires patching
 * Transition/index.tsx to accept layout-mode mounting; deferred.
 *
 * What this layout DOES own:
 *   - the canvas (uniform deep luminance + low atmosphere)
 *   - the rail / main grid (no max-width)
 *   - the global "Settings" identity is implicit from the rail + URL;
 *     the inline header band has been retired.
 */
export default async function SettingsLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings");

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
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

      {/* Mobile / small screens: the rail collapses to a horizontal snap
          scroller above the content. */}
      <div className="px-6 pt-32 xl:hidden">
        <TableOfContentsMobile
          mode="route"
          items={TOC_ITEMS}
          ariaLabel="Settings sections"
          labelStyle="sans"
        />
      </div>

      {/* xl+: rail / main grid. No max-width — content uses the canvas. */}
      <div className="mx-auto grid w-full grid-cols-1 gap-x-12 px-6 pt-12 pb-20 xl:grid-cols-[232px_minmax(0,1fr)] xl:gap-x-16 xl:px-10 xl:pt-32 2xl:gap-x-20 2xl:px-16">
        <aside className="hidden xl:sticky xl:top-32 xl:block xl:self-start">
          <TableOfContents
            mode="route"
            items={TOC_ITEMS}
            ariaLabel="Settings sections"
            labelStyle="sans"
          />
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
