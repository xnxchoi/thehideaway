import { BroadcastHub } from "../../../../../components/content/Radio/Broadcast/BroadcastHub";
import { BeatDetectorControls } from "@/providers/HideawayFM/BeatDetectorControls";
import { RPage } from "@/components/UX/Transition";
import { queryAllReleases } from "@/payload/collections/Radio/api/queryAllReleases";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

export const metadata: Metadata = {
  title: "Hideaway FM",
  description: "On Air — releases and broadcasts from The Hideaway."
};

export default async function RadioPage() {
  const releases = await getRadioReleases();

  return (
    <RPage slug={["radio"]} type={"pages"}>
      <BroadcastHub releases={releases} />
      {/* Dev-only live tuning panel for the beat detector. Hidden in
          production builds via the NODE_ENV check; in dev it shows a
          Leva panel (toggle visibility with the `h` keybind). */}
      {process.env.NODE_ENV !== "production" && <BeatDetectorControls />}
    </RPage>
  );
}

async function getRadioReleases() {
  "use cache";
  cacheLife("hours");
  cacheTag("radio");
  return queryAllReleases();
}
