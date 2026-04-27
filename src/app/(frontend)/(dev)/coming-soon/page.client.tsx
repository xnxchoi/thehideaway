"use client";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Link } from "@/components/core/Link/Link";
import { useCallback, useState } from "react";
import {
  ComingSoonCard,
  ComingSoonDialog,
  ComingSoonPanel,
  ComingSoonSection,
  ComingSoonTag,
  useComingSoon,
  type DispatchKey
} from "@/components/UX/ComingSoon";

export default function PageClient() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-6 xl:px-10">
        <header className="mb-16 border-b border-border/30 pb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Dev / ComingSoon
          </p>
          <h1 className="mt-2 text-3xl font-light tracking-tight xl:text-4xl">
            Coming Soon System
          </h1>
          <p className="mt-3 max-w-xl font-mono text-[11px] leading-relaxed text-muted-foreground/70">
            Components in realistic layout contexts.
          </p>
        </header>
      </div>

      {/* useComingSoon — nudge on a dead nav item */}
      <Scene
        label="useComingSoon — dead nav item fires toast"
        hint="click 「Compilations」"
      >
        <MockNav />
      </Scene>

      {/* ComingSoonTag — in a nav item + section heading */}
      <Scene
        label="ComingSoonTag — on a nav item and a section heading"
        hint="hover for tooltip"
      >
        <MockPageHeader />
      </Scene>

      {/* ComingSoonDialog — from a create toolbar */}
      <Scene
        label="ComingSoonDialog — triggered from an action button"
        hint="click 「New Series」"
      >
        <MockCreateToolbar />
      </Scene>

      {/* ComingSoonCard — in a content grid */}
      <Scene label="ComingSoonCard — placeholder slot in a content grid">
        <MockContentGrid />
      </Scene>

      {/* ComingSoonSection — between page content */}
      <Scene label="ComingSoonSection — between page sections">
        <MockPageBody />
      </Scene>

      {/* ComingSoonPanel — as the whole route */}
      <Scene label="ComingSoonPanel — entire route not yet ready" fullBleed>
        <ComingSoonPanel
          title="Series"
          dispatch="composing"
          preset="wetInk"
          topic="series"
        />
      </Scene>
    </div>
  );
}

/* ─── Realistic mocks ──────────────────────────────────────────── */

function MockNav() {
  const { nudge } = useComingSoon();
  const items = [
    { label: "Essays", href: "#" },
    { label: "Radio", href: "#" },
    { label: "Lists", href: "#" }
  ];
  return (
    <nav className="flex items-center gap-8 border-b border-border/30 px-6 py-4">
      <span className="font-mono text-xs tracking-widest text-foreground/80 uppercase">
        The Hideaway
      </span>
      <div className="ml-auto flex items-center gap-6">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => nudge("notYet")}
          className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground"
        >
          Compilations
        </button>
      </div>
    </nav>
  );
}

function MockPageHeader() {
  const navItems = ["Essays", "Radio", "Lists"];
  return (
    <div>
      <header className="flex items-end justify-between border-b border-border/30 px-6 py-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Discover
          </p>
          <h1 className="mt-1 text-2xl font-light tracking-tight">Read</h1>
        </div>
        <nav className="flex items-center gap-5">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground"
            >
              {item}
            </a>
          ))}
          <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-muted-foreground/40 uppercase">
            Series
            <ComingSoonTag preset="soon" tooltip="composition" tone="firm" />
          </span>
        </nav>
      </header>
      <div className="px-6 pt-8">
        <div className="flex items-center gap-3">
          <p className="font-mono text-[11px] tracking-[0.15em] text-muted-foreground/60 uppercase">
            Long reads
          </p>
          <ComingSoonTag preset="draft" tooltip="editor" tone="soft" />
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground/40">
          — this section isn't ready yet —
        </p>
      </div>
    </div>
  );
}

function MockCreateToolbar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center gap-3 border-b border-border/20 pb-6">
        <p className="mr-auto font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          Vault / Content
        </p>
        <button
          type="button"
          className="border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/70 uppercase transition-colors hover:border-border hover:text-foreground"
        >
          New Essay
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-muted-foreground/40 uppercase transition-colors hover:border-border/60 hover:text-foreground/60"
        >
          New Series
          <ComingSoonTag preset="soon" tone="firm" tooltip={false} />
        </button>
      </div>
      <MockEssayRows />
      <ComingSoonDialog
        title="Series"
        dispatch="composing"
        preset="soon"
        open={open}
        onOpenChange={setOpen}
        notify
        topic="series"
      />
    </div>
  );
}

function MockEssayRows() {
  const rows = [
    { title: "On solitude and the city", status: "Published", date: "Apr 18" },
    { title: "What the archive remembers", status: "Draft", date: "Apr 12" },
    {
      title: "A season of small departures",
      status: "Published",
      date: "Mar 30"
    }
  ];
  const [hovered, setHovered] = useState<boolean>(false);
  const onMousdEnter = useCallback(() => setHovered(true), [setHovered]);
  const onMousdLeave = useCallback(() => setHovered(false), [setHovered]);
  return (

    <div className="relative divide-y divide-border/20">
      {rows.map((row) => (
        <m.div
          onMouseEnter={onMousdEnter}
          onMouseLeave={onMousdLeave}
          key={row.title}
          data-active={hovered}
          whileHover={{
            backgroundColor: "oklch(from var(--faded-foreground) r g b / 0.4)"
          }}
          className="background-transparent data-color flex items-center justify-between py-3.5"
        >
          <Link href="/home" className="absolute inset-0 z-1 block" />
          <p className="text-sm font-light tracking-tight text-foreground/80">
            {row.title}
          </p>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] text-muted-foreground/50">
              {row.date}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
              {row.status}
            </span>
          </div>
        </m.div>
      ))}
    </div>
  );
}

function MockContentGrid() {
  const posts = [
    { title: "On solitude and the city", cat: "Essay" },
    { title: "What the archive remembers", cat: "Essay" },
    { title: "A season of small departures", cat: "Essay" }
  ];
  return (
    <div className="px-6 py-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {posts.map((post) => (
          <MockPostCard key={post.title} title={post.title} cat={post.cat} />
        ))}
        <ComingSoonCard preset="queued" aspect="portrait" />
      </div>
    </div>
  );
}

function MockPostCard({ title, cat }: { title: string; cat: string }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-border/20 bg-card/40 transition-colors hover:border-border/40">
      <div className="flex aspect-[3/4] items-center justify-center bg-muted/20">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground/20 uppercase">
          {cat}
        </span>
      </div>
      <div className="p-3.5">
        <p className="text-sm leading-snug font-medium tracking-tight">
          {title}
        </p>
      </div>
    </div>
  );
}

function MockPageBody() {
  return (
    <div className="mx-auto max-w-2xl space-y-0 px-6 py-8">
      <MockProse heading="Introduction" lines={3} />
      <ComingSoonSection
        preset="draft"
        copy="Annotations — in development. Coming alongside the essay."
      />
      <MockProse heading="Part I" lines={4} />
    </div>
  );
}

function MockProse({ heading, lines }: { heading: string; lines: number }) {
  return (
    <div className="py-8">
      <m.h2 className="mb-4 text-lg font-light tracking-tight text-foreground/80">
        {heading}
      </m.h2>
      <m.div className="space-y-2">
        <AnimatePresence>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded-sm bg-foreground/[0.06]"
              style={{ width: `${75 + Math.sin(i * 2.1) * 20}%` }}
            />
          ))}
        </AnimatePresence>
      </m.div>
    </div>
  );
}

/* ─── Scene wrapper ────────────────────────────────────────────── */

function Scene({
  label,
  hint,
  fullBleed = false,
  children
}: {
  label: string;
  hint?: string;
  fullBleed?: boolean;
  children: React.ReactNode;
}) {
  const [dark, setDark] = useState(true);

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-6 xl:px-10">
        <div className="mb-3 flex items-center justify-between border-b border-border/20 pb-3">
          <div className="flex items-baseline gap-3">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              {label}
            </p>
            {hint && (
              <span className="font-mono text-[10px] text-muted-foreground/40 italic">
                {hint}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="font-mono text-[9px] tracking-widest text-muted-foreground/40 uppercase transition-colors hover:text-muted-foreground/80"
          >
            {dark ? "light ↕" : "dark ↕"}
          </button>
        </div>
      </div>
      <div className={dark ? "dark bg-background" : "light bg-background"}>
        {fullBleed ? (
          children
        ) : (
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-none border border-x-0 border-border/10">
              {children}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
