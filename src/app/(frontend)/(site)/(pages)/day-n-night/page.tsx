import { cookies } from "next/headers";
import { RPage } from "@/components/UX/Transition";
import { DayNNightLanding } from "@/components/sections/DayNNight";
import { DAY_N_NIGHT_VIEW_COOKIE } from "@/components/sections/DayNNight/useViewPref";
import type { DayNNightView } from "@/components/sections/DayNNight/useViewPref";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Day n Night",
  description:
    "An evening that turns the night — cookout at sundown, cocktails after the burn-down. Haebangchon, May 24, 2026."
};

/**
 * /day-n-night — one-off event landing for Day n Night, May 24, 2026.
 *
 * Server reads the user's cookie-stored view preference and hands the
 * initial value to the client entry. First-time visitors land on the
 * immersive view; returning visitors keep whatever they last selected
 * via the on-page toggle.
 */
export default async function DayNNightPage() {
  const store = await cookies();
  const raw = store.get(DAY_N_NIGHT_VIEW_COOKIE)?.value;
  const initialView: DayNNightView =
    raw === "simplified" ? "simplified" : "immersive";

  return (
    <RPage type="pages" slug={["day-n-night"]}>
      <DayNNightLanding initialView={initialView} />
    </RPage>
  );
}
