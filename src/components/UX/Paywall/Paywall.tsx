import Link from "next/link";
import RichText from "@/payload/fields/RichText";
import type { GateResult } from "./gatePost";

export type PaywallTeaser = {
  root: {
    type?: string;
    children: unknown[];
    direction?: string | null;
    format?: string;
    indent?: number;
    version?: number;
  };
};

export type PaywallProps = {
  gate: GateResult;
  postTitle: string;
  postEyebrow?: string;
  teaser?: PaywallTeaser | null;
  currentPath?: string;
};

const tierCopy: Record<
  "member" | "patron" | "author" | "editor" | "admin",
  { label: string; cta: string; pitch: string }
> = {
  member: {
    label: "Members",
    cta: "Become a Member",
    pitch:
      "The rest of this essay is for Members. Highlight, annotate, and follow the writers you love. ₩9,000 / mo · ₩90,000 / yr."
  },
  patron: {
    label: "Patrons",
    cta: "Become a Patron",
    pitch:
      "This essay is reserved for Patrons. Includes everything a Member gets, plus drops, events, and the quarterly print. ₩29,000 / mo."
  },
  author: {
    label: "Authors",
    cta: "Become a Member",
    pitch: "Author access is granted to active Members with editor approval."
  },
  editor: {
    label: "Editors",
    cta: "Contact us",
    pitch: "Editor access is staff-only."
  },
  admin: {
    label: "Admins",
    cta: "Contact us",
    pitch: "Admin access is staff-only."
  }
};

export function Paywall({
  gate,
  postTitle,
  postEyebrow,
  teaser,
  currentPath
}: PaywallProps) {
  const requiredKey =
    gate.requiredRole &&
    gate.requiredRole !== "guest" &&
    gate.requiredRole !== "user"
      ? gate.requiredRole
      : "member";
  const copy = tierCopy[requiredKey as keyof typeof tierCopy];
  const needsAuth = gate.reason === "auth-required";
  const loginHref = currentPath
    ? `/login?redirect=${encodeURIComponent(currentPath)}`
    : "/login";

  const hasTeaser =
    teaser &&
    teaser.root &&
    Array.isArray(teaser.root.children) &&
    teaser.root.children.length > 0;

  return (
    <article className="relative mx-auto max-w-2xl px-6 pb-32 pt-20 xl:px-0">
      {/* Eyebrow + headline */}
      <header className="mb-10">
        {postEyebrow ? (
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            {postEyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-light leading-[1.15] tracking-tight text-foreground sm:text-4xl xl:text-5xl">
          {postTitle}
        </h1>
      </header>

      {/* Teaser content with fade-to-background mask at the bottom */}
      {hasTeaser ? (
        <div className="relative mb-2">
          <div className="prose prose-neutral dark:prose-invert max-w-none font-mono text-[12px] leading-[1.85] text-foreground/85 [&_h1]:font-light [&_h2]:font-light [&_h3]:font-light [&_p]:my-5">
            {/* RichText accepts the lexical state object. Cast to satisfy its
                stricter signature; the renderer tolerates partial trees. */}
            <RichText
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={teaser as any}
              enableGutter={false}
            />
          </div>
          {/* Fade mask from transparent to background — disguises the cut */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-1 h-24 bg-gradient-to-b from-transparent to-background"
          />
        </div>
      ) : null}

      {/* Gate */}
      <section
        role="region"
        aria-label="Continue reading"
        className="relative mt-12 border-t border-border/30 pt-12"
      >
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
          ◌ {copy.label} only · the rest is reserved
        </p>

        <h2 className="mb-5 text-2xl font-light leading-tight tracking-tight text-foreground xl:text-3xl">
          {needsAuth
            ? "Sign in to keep reading"
            : `Continue reading as a ${copy.label.replace(/s$/, "")}`}
        </h2>

        <p className="mb-10 max-w-prose font-mono text-[12px] leading-relaxed text-muted-foreground">
          {copy.pitch}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {needsAuth ? (
            <Link
              href={loginHref}
              prefetch={false}
              className="inline-flex h-11 items-center border border-border/50 px-5 font-mono text-[11px] uppercase tracking-widest text-foreground/85 transition-colors hover:border-border hover:text-foreground"
            >
              Sign in
            </Link>
          ) : null}
          <Link
            href="/plans"
            prefetch={false}
            className="inline-flex h-11 items-center border border-foreground/80 bg-foreground px-5 font-mono text-[11px] uppercase tracking-widest text-background transition-colors hover:bg-foreground/90"
          >
            {needsAuth ? "View plans" : copy.cta}
          </Link>
          <Link
            href="/plans"
            prefetch={false}
            className="ml-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            What's included
          </Link>
        </div>

        <p className="mt-12 max-w-prose font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
          The Hideaway · Seoul
        </p>
      </section>
    </article>
  );
}
