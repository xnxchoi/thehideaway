import { TapePlayer } from "@/components/UX/TapePlayer";
import { RPage } from "@/components/UX/Transition";
import { Metadata } from "next";
import RadioClient from "@/app/(frontend)/(site)/(pages)/radio/page.client";

export const metadata: Metadata = {
  title: "Radio — The Hideaway",
  description: "Listen to The Hideaway Sessions"
};

export default function RadioPage() {
  return (
    <RPage slug={["radio"]} type={"pages"}>
      <div className="my-10 flex min-h-screen flex-col">
        {/* Hero section with scroll-linked tape reels */}
        <TapePlayer variant="hero" />

        {/* Full player below the fold */}
        <section className="bg-off-bg/30 flex flex-1 items-start justify-center px-4 py-12">
          <RadioClient />
        </section>
      </div>
    </RPage>
  );
}
