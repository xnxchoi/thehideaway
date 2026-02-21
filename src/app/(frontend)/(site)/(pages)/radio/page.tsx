import { TapePlayer } from "@/components/UX/TapePlayer";
import { RPage } from "@/components/UX/Transition";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Radio — The Hideaway",
  description: "Listen to The Hideaway Sessions",
};

export default function RadioPage() {
  return (
    <RPage slug={["radio"]} type={"pages"}>
      <div className="flex my-10 min-h-screen flex-col">
        {/* Hero section with scroll-linked tape reels */}
        <TapePlayer variant="hero" />

        {/* Full player below the fold */}
        <section className="flex flex-1 items-start justify-center bg-off-bg/30 px-4 py-12">
          <TapePlayer variant="full" />
        </section>
      </div>
    </RPage>
  );
}
