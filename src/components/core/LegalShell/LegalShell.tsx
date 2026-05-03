import { ReactNode } from "react";

import { Link } from "@/components/core/Link/Link";

interface TocItem {
  id: string;
  label: string;
}

interface LegalShellProps {
  eyebrow: string;
  title: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  toc: TocItem[];
  tocLabel: string;
  relatedLabel: string;
  related: { href: string; label: string }[];
  children: ReactNode;
}

/**
 * Editorial 2-col legal-document layout. Wide column on the left holds the
 * body; sticky right column holds title metadata, table of contents, and
 * related links so the page actually uses the screen on xl+.
 */
export function LegalShell({
  eyebrow,
  title,
  lastUpdatedLabel,
  lastUpdated,
  toc,
  tocLabel,
  relatedLabel,
  related,
  children
}: LegalShellProps) {
  return (
    <div className="px-6 pt-[10em] pb-[6em] sm:px-10 sm:pt-[15em] xl:px-16 2xl:px-32">
      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:gap-24 2xl:gap-32">
        <article className="prose prose-lg max-w-none space-y-[2em] leading-[1.75] opacity-90 prose-neutral xl:prose-xl 2xl:prose-2xl dark:prose-invert">
          <header className="not-prose mb-12 xl:mb-20 2xl:mb-24">
            <p className="font-mono text-xs tracking-widest text-foreground/45 uppercase xl:text-sm">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-5xl leading-[1.05] font-light tracking-tight text-balance xl:text-7xl 2xl:text-8xl">
              {title}
            </h1>
            <p className="mt-8 font-mono text-sm text-foreground/45 xl:text-base">
              {lastUpdatedLabel}
              {lastUpdated}
            </p>
          </header>
          {children}
        </article>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="border-l border-border/20 pl-6 xl:border-l-2 xl:pl-10">
            <p className="font-mono text-xs tracking-widest text-foreground/40 uppercase xl:text-sm">
              {tocLabel}
            </p>
            <nav aria-label={tocLabel} className="mt-6">
              <ol className="space-y-3 font-mono text-sm leading-relaxed xl:space-y-3.5 xl:text-base">
                {toc.map((item, index) => (
                  <li key={item.id} className="flex gap-4">
                    <span className="w-7 shrink-0 text-foreground/30 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <a
                      href={`#${item.id}`}
                      className="text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {related.length > 0 ? (
              <div className="mt-12 border-t border-border/15 pt-8">
                <p className="font-mono text-xs tracking-widest text-foreground/40 uppercase xl:text-sm">
                  {relatedLabel}
                </p>
                <ul className="mt-5 space-y-3 font-mono text-sm xl:text-base">
                  {related.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-foreground/70 transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
