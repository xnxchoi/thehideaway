import { Metadata } from "next";
import { DemimondeHeroIsland } from "./DemimondeHeroIsland";
import { DemimondeArchiveIsland } from "./DemimondeArchiveIsland";
import DemimondePageClient from "./page.client";
import s from "./Demimonde.module.scss";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demimonde — The Hideaway",
  description: "An archive of five nights. On the record, names off."
};

export default function DemimondePage() {
  return (
    <main className={s.shell} data-theme="dark">
      <DemimondePageClient />
      <DemimondeHeroIsland />
      <DemimondeArchiveIsland />
    </main>
  );
}
