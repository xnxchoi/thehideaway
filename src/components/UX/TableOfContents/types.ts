/**
 * Shared types for the gradient-led TableOfContents primitive.
 *
 * Two modes, one component family:
 *
 * - `route`  — items are route links; active state derived from current
 *              pathname (server / client routing). Used by `/me/settings`.
 * - `anchor` — items are in-page anchors; active state derived from
 *              IntersectionObserver scroll-spy. Used by `/terms`, `/privacy`,
 *              and any long-form document with a persistent rail.
 */

export type TocMode = "route" | "anchor";

export interface TocItem {
  /** Anchor id (anchor mode). Used as the `<a href="#${id}">` target. */
  id?: string;
  /** Route href (route mode). */
  href?: string;
  /** Visible label (mono caps in default styling). */
  label: string;
  /**
   * Optional pre-formatted number/marker, e.g. "01", "I". Defaults to a
   * zero-padded ordinal derived from the item's index when omitted.
   */
  number?: string;
}

export interface TableOfContentsBaseProps {
  items: TocItem[];
  /** Accessible label for the nav landmark. Defaults to "Contents". */
  ariaLabel?: string;
  className?: string;
}

export interface TableOfContentsRouteProps extends TableOfContentsBaseProps {
  mode: "route";
  /** Optional: predicate to determine active state for a given href + pathname. */
  isActive?: (pathname: string, href: string) => boolean;
}

export interface TableOfContentsAnchorProps extends TableOfContentsBaseProps {
  mode: "anchor";
  /**
   * Top offset (px) used to bias the scroll-spy hit zone — usually equals the
   * sticky header height on the page. Defaults to 96.
   */
  scrollOffsetTop?: number;
}

export type TableOfContentsProps =
  | TableOfContentsRouteProps
  | TableOfContentsAnchorProps;
