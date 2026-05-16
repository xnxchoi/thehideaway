import { Metadata } from "next";
import { RPage } from "@/components/UX/Transition";
import DemimondePageClient from "./page.client";
import { DemimondeCursor } from "./DemimondeCursor";
import { DemimondeScatter } from "./DemimondeScatter";
import { DemimondeHero } from "./DemimondeHero";
import { DemimondeFacts } from "./DemimondeFacts";
import { DemimondeWelcome } from "./DemimondeWelcome";
import { DemimondeTurntable } from "./DemimondeTurntable";
import { DemimondePacking } from "./DemimondePacking";
import { DemimondeSchedule } from "./DemimondeSchedule";
import { DemimondeMap } from "./DemimondeMap";
import { DemimondeDirections } from "./DemimondeDirections";
import { DemimondePhrases } from "./DemimondePhrases";
import { DemimondeFAQ } from "./DemimondeFAQ";
import { DemimondeClosing } from "./DemimondeClosing";
import s from "./Demimonde.module.scss";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demimonde · Garden cookout — The Hideaway",
  description:
    "One Sunday in the garden. Linen, second courses, songs you brought. RSVP by Friday."
};

/**
 * Demimonde — cookout invitation landing.
 *
 * Structure mirrors week.wild.plus/athens-26 (hero → facts → welcome →
 * turntable → packing → schedule → directions → phrases → faq → closing),
 * but the visual mood is sun-warmed paper rather than cold blue marble.
 *
 * The shell carries a `data-demimonde-shell` hook so DemimondeCursor can
 * target it for cursor-tracked CSS variable writes. The scatter element
 * is mounted once at shell-level so floating words drift across every
 * section as you scroll.
 */
export default function DemimondePage() {
  return (
    <RPage slug={[]} type="pages" className={s.shell}>
      <DemimondePageClient />
      <DemimondeCursor />
      <DemimondeScatter />
      <DemimondeHero />
      <DemimondeFacts />
      <DemimondeWelcome />
      <DemimondeTurntable />
      <DemimondePacking />
      <DemimondeSchedule />
      <DemimondeMap />
      <DemimondeDirections />
      <DemimondePhrases />
      <DemimondeFAQ />
      <DemimondeClosing />
    </RPage>
  );
}
