import { TapeConnect } from "@/components/Radio/Tapes/TapeConnect";
import { TapeHero } from "@/components/Radio/Tapes/TapeHero";
import { TapeStory, type StoryBlock } from "@/components/Radio/Tapes/TapeStory";
import { StationHideawayHero } from "@/components/sections/StationHideaway/block";
import { RPage } from "@/components/UX/Transition";
import type { Metadata } from "next";

/**
 * Hideaway FM — Tape, Vol. 001
 *
 * Pilot for the hand-crafted Tape format. Each Tape gets its own folder
 * under `/radio/tapes/` with its own `page.tsx` so the layout can be
 * fully art-directed per volume — no CMS template, no shared schema.
 *
 * Building blocks:
 *   - StationHideawayHero  — the 3D cassette parallax (lives only here)
 *   - TapeHero             — eyebrow / h1 / factual subhead
 *   - TapeStory            — alternating story blocks with photography
 *   - TapeConnect          — artist links + return-to-broadcast handoff
 *
 * Replace the placeholder content below with the real Vol. 001 copy
 * when it's authored. The structure stays the same; the words change.
 */

export const metadata: Metadata = {
  title: "Tape, Vol. 001 — Hideaway FM",
  description: "The Hideaway Sessions — Vol. 001."
};

const STORY_BLOCKS: StoryBlock[] = [
  {
    eyebrow: "· The Artist",
    heading: "[Placeholder: artist introduction]",
    body: "[Placeholder: a brief introduction to the artist — their journey, influences, the signature you'll hear across the tracklist. One paragraph, factual, written in the publication's voice.]",
    imageSide: "right"
  },
  {
    eyebrow: "· The Meeting",
    heading: "[Placeholder: how this volume came together]",
    body: "[Placeholder: the story of how the artist and The Hideaway connected. Short, specific, dated. Avoid 'collaboration' as a verb.]",
    imageSide: "left"
  },
  {
    eyebrow: "· The Process",
    heading: "[Placeholder: in the studio]",
    body: "[Placeholder: behind the scenes of the recording. What rooms, what gear, what sessions. The texture that liner notes used to carry.]",
    imageSide: "right"
  },
  {
    eyebrow: "· The Sound",
    heading: "[Placeholder: about the music]",
    body: "[Placeholder: the musical direction of this volume — moods, references, intention. Written for a reader who is about to press play, not one who has already decided.]"
  }
];

export default function TapeVol001Page() {
  return (
    <RPage slug={["radio", "tapes", "vol-001"]} type={"pages"}>
      <article className="relative w-full">
        {/* Parallax 3D cassette — lives ONLY on Tape pages */}
        <StationHideawayHero />

        {/* Editorial title block */}
        <TapeHero
          eyebrow="Hideaway FM — Tape · Vol. 001"
          title="Artist Name"
          subhead="Recorded in Seoul · Edition of [n] · Released [yyyy.mm.dd]"
        />

        {/* Story */}
        <TapeStory blocks={STORY_BLOCKS} />

        {/* Colophon — every Tape ends with one */}
        <Colophon />

        {/* Connect — artist links + return to /radio */}
        <TapeConnect
          heading="Follow the Artist"
          blurb="Discover more of their work and follow the journey."
          links={[
            {
              label: "Instagram ↗",
              href: "https://instagram.com/"
            }
          ]}
        />
      </article>
    </RPage>
  );
}

/**
 * End-of-Tape colophon. Footnote-grade type, factual lines only.
 * The pattern: print the records as if it were the back of a J-card.
 */
function Colophon() {
  return (
    <section className="border-t border-border/20 py-16 xl:py-20">
      <div className="mx-auto max-w-7xl px-6 xl:px-10">
        <p className="mb-6 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase xl:text-[11px]">
          · Colophon
        </p>
        <dl className="grid grid-cols-1 gap-x-12 gap-y-3 font-mono text-[11px] text-muted-foreground/60 sm:grid-cols-2 lg:grid-cols-4 xl:text-xs">
          <ColophonRow label="Recorded" value="[Studio, City]" />
          <ColophonRow label="Mixed by" value="[Name]" />
          <ColophonRow label="Mastered by" value="[Name]" />
          <ColophonRow label="Edition" value="[n] copies" />
        </dl>
        <p className="mt-12 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/30 uppercase xl:text-[11px]">
          End of broadcast.
        </p>
      </div>
    </section>
  );
}

interface ColophonRowProps {
  label: string;
  value: string;
}

function ColophonRow({ label, value }: ColophonRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground/40">{label}</dt>
      <dd className="text-foreground/80">{value}</dd>
    </div>
  );
}
