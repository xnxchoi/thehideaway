import { Link } from "@/components/core/Link/Link";
import { FrontImage } from "@/components/core/Media/FrontImage";
import { PlaceHolderImage } from "@/components/core/Media/Image/PlaceHolderImage";
import { cn } from "@/lib/utils";
import { PostOverview } from "@/types/collections/posts";
import { DateTime } from "luxon";

type FeaturedHeroProps = {
  article: PostOverview;
  /** Lead-position flag. Triggers `loading="eager"` + `fetchPriority="high"`. */
  eager?: boolean;
  className?: string;
};

export const FeaturedHero = ({
  article,
  eager = false,
  className
}: FeaturedHeroProps) => {
  const category =
    typeof article.category === "object" && article.category?.title
      ? article.category.title
      : null;
  const subtitle = article.subtitle?.trim();
  const authorName = article.author?.name?.trim();
  const relativeDate = article.publishedAt
    ? (DateTime.fromISO(article.publishedAt).toRelative() ?? "")
    : "";

  return (
    <article
      className={cn(
        "group relative isolate flex flex-col bg-card",
        "transition-colors duration-150 ease-[cubic-bezier(.4,0,.2,1)]",
        className
      )}
    >
      <Link
        href={`/essays/${article.slug}`}
        className="absolute inset-0 z-10"
        aria-label={article.title}
      />

      <div className="relative aspect-video w-full overflow-hidden bg-muted/20">
        {article.image ? (
          <FrontImage
            resource={article.image}
            aspectRatio={16 / 9}
            loading={eager ? "eager" : "lazy"}
            priority={eager}
            imgClassName="absolute inset-0 block h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.02]"
          />
        ) : (
          <PlaceHolderImage className="absolute inset-0 h-full w-full" />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[8%] bg-gradient-to-t from-card to-transparent"
        />
      </div>

      <div className="flex flex-col gap-y-3 p-5 xl:gap-y-4 xl:p-6">
        {category && (
          <span className="inline-block self-start rounded-sm border border-border/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            {category}
          </span>
        )}

        <span className="block text-balance font-serif text-3xl font-light leading-[1.05] tracking-tight sm:text-4xl md:text-5xl xl:text-6xl [overflow-wrap:anywhere]">
          {article.title}
        </span>

        {subtitle && (
          <span className="block max-w-[60ch] text-pretty font-sans text-base leading-snug text-foreground/70 sm:text-lg lg:text-xl [overflow-wrap:anywhere]">
            {subtitle}
          </span>
        )}

        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 xl:text-[11px]">
          {authorName ? `By ${authorName}` : "Hideaway"}
          {relativeDate && (
            <>
              <span aria-hidden className="mx-2">·</span>
              <time dateTime={article.publishedAt}>{relativeDate}</time>
            </>
          )}
        </div>
      </div>
    </article>
  );
};
