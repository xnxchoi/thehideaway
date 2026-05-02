import { Metadata } from "next";
import { DemimondeHeroIsland } from "./DemimondeHeroIsland";
import { DemimondeArchiveIsland } from "./DemimondeArchiveIsland";
import DemimondePageClient from "./page.client";
import s from "./Demimonde.module.scss";
import { RPage } from "@/components/UX/Transition";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demimonde — The Hideaway",
  description: "An archive of five nights. On the record, names off."
};

export default function DemimondePage() {
  return (
    <RPage slug={[]} type="pages" className={s.shell}>
      <DemimondePageClient />
      <DemimondeHeroIsland />
      <DemimondeArchiveIsland />
    </RPage>
  );
}
