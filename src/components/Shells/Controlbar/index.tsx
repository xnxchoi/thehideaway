"use client";

import { UserAvatar } from "@/lib/auth/betterauth-ui/src";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/providers/MiddleMan";
import { useNotifications } from "@/providers/Notifications";
import { useHasRadio } from "@/providers/HideawayFM/hooks";
import { useRPStore } from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import type { ControlbarView } from "@/stores/RP_Ui";
import { Bell, Moon, Search, Sun, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import * as m from "motion/react-m";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/shallow";
import { CheckInButton } from "../Header/CheckInButton";
import { PlayPauseButton } from "@/components/UX/TapePlayer";

/**
 * Persistent bottom strip on touch-mobile.
 *
 * Mounted once at the layout level (sibling of `<SideDrawer/>` and
 * `<SearchSheet/>`) so it stays visible regardless of Drawer / Menu
 * state. Self-gates on `isMobile && isTouch`, and hides while the
 * full-screen `SearchSheet` is up (the sheet has its own dismissal UI).
 *
 * Zones — left | center | right:
 *   Left:   PlayPauseButton (when a radio session is loaded) → falls back
 *           to ThemeButton when no radio. Toggles audio in place; never
 *           changes the controlbar view or opens the drawer.
 *   Center: Search pill — opens the SearchSheet.
 *   Right:  Signed-in → NotificationsTrigger (bell + unread badge) +
 *           AccountTrigger (avatar). Notifications flips the drawer to
 *           the "notifications" view, account to "account".
 *           Signed-out → CheckInButton (auth entry).
 *
 * Stacking:
 *   z-[265]  Controlbar (this)              ← top-most persistent surface
 *   z-[260/261]  SearchSheet                ← Controlbar floats over it
 *   z-[248]  Menu (`menu__body`)
 *   z-[239]  SideDrawer
 *   z-[238]  SideDrawerPullTab
 *
 * Portaled to <body> so that transformed ancestors in the layout tree
 * (Lenis wrappers, ContentMask's motion.divs, the LazyMotion subtree)
 * don't turn `position: fixed` into ancestor-relative positioning. The
 * same issue that pushed the PullTab off-center clipped the bar
 * vertically here.
 */

const ZONE_BTN =
  "inline-flex size-12 items-center justify-center rounded-full touch-manipulation text-nav-foreground/75 active:bg-nav-foreground/[0.06] active:text-nav-foreground transition-colors";
const ZONE_BTN_ACTIVE = "text-nav-foreground bg-nav-foreground/[0.06]";

export const Controlbar = () => {
  const t = useTranslations("Controlbar");
  const { isMobile, isTouch } = useIsMobile();
  const userId = useRPSession(useShallow((r) => r.id));
  const isSignedIn = Boolean(userId);
  const hasRadio = useHasRadio();

  const view = useRPStore(useShallow((s) => s.controlbarView));
  const toggleView = useRPStore((s) => s.toggleControlbarView);
  const setSideDrawerOpen = useRPStore((s) => s.setSideDrawerOpen);
  const sidebarOpen = useRPStore(useShallow((s) => s.sidebarOpen));
  const searchSheetOpen = useRPStore(useShallow((s) => s.searchSheetOpen));
  const toggleSearchSheetOpen = useRPStore((s) => s.toggleSearchSheetOpen);
  const navIsOpen = useRPStore(useShallow((s) => s.navIsOpen));
  const setNavIsOpen = useRPStore((s) => s.setNavIsOpen);

  const select = useCallback(
    (next: ControlbarView) => {
      // Tapping a view-trigger flips the drawer to that view. If the
      // Menu is up, close it first so the user actually sees the drawer
      // (the Menu paints over the drawer at z-248).
      toggleView(next);
      if (!sidebarOpen) setSideDrawerOpen(true);
      if (navIsOpen) setNavIsOpen(false);
    },
    [toggleView, setSideDrawerOpen, sidebarOpen, navIsOpen, setNavIsOpen]
  );

  // iOS Safari only summons the soft keyboard from `input.focus()` calls
  // made INSIDE a user-gesture handler. Calling focus from a useEffect
  // after the sheet animates in falls outside that window — the input
  // gets focused programmatically but no keyboard appears. The fix is
  // a "focus keeper" decoy: synchronously focus this offscreen input
  // from the click handler (still in gesture context, so iOS opens the
  // keyboard); the SearchSheet then transfers focus to the real input
  // on mount via `useLayoutEffect`, and the keyboard slides over to the
  // new target without ever closing.
  const focusKeeperRef = useRef<HTMLInputElement>(null);
  const onSearch = useCallback(() => {
    if (!searchSheetOpen) focusKeeperRef.current?.focus();
    toggleSearchSheetOpen();
  }, [searchSheetOpen, toggleSearchSheetOpen]);

  // Portal target resolved client-side; null on SSR (correct — touch-only UI).
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Touch-mobile-only. We deliberately keep rendering the bar while the
  // SearchSheet is open (the sheet sits below the bar's z-index) so the
  // iOS keyboard-keeper input stays mounted across the open transition.
  // Unmounting it would defocus the decoy before the real sheet input
  // takes focus, and iOS would drop the keyboard.
  if (!(isMobile && isTouch) || !portalTarget) return null;

  return createPortal(
    <m.nav
      data-tour="controlbar"
      role="navigation"
      aria-label={t("account")}
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 16, opacity: 0 }}
      transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
      className={cn(
        // Fixed bottom strip — see stacking notes in the component
        // docblock. Above SearchSheet (z-260/261) so it stays accessible
        // while the sheet is open.
        "fixed inset-x-0 bottom-0 z-[265]",
        // `touch-none` blocks pan/scroll gestures started on the bar
        // from propagating to body. Tap-clicks on the inner buttons
        // still synthesize normally. Without this, a drag on the bar
        // (which sits above the SearchSheet) scrolled the page behind.
        "touch-none",
        "border-t border-nav-foreground/20",
        "bg-nav-background/95 text-nav-foreground backdrop-blur-xl",
        "pb-[calc(env(safe-area-inset-bottom)+12px)]"
      )}
    >
      {/* Inner grid: horizontal padding bumped to match the FXFrame's
          lateral inset (~10px) plus a small breathing margin, so the
          login / play-pause / account buttons don't crowd the viewport
          edges. Inner gap stays the same. */}
      <div className="mx-auto grid h-16 max-w-[640px] grid-cols-[auto_1fr_auto] items-center gap-2 px-[18px]">
        <LeftZone hasRadio={hasRadio} themeLabel={t("theme")} />

        <button
          type="button"
          aria-label={t("search")}
          aria-pressed={searchSheetOpen}
          onClick={onSearch}
          className={cn(
            "group inline-flex h-12 items-center gap-3 rounded-full px-5",
            "border border-nav-foreground/30",
            "touch-manipulation transition-colors",
            searchSheetOpen
              ? "bg-nav-foreground/[0.09] text-nav-foreground"
              : "bg-nav-foreground/[0.04] text-nav-foreground/65 active:bg-nav-foreground/[0.08]"
          )}
        >
          <Search
            aria-hidden="true"
            className="size-[18px]"
            strokeWidth={1.5}
          />
          <span className="font-sans text-sm font-normal">{t("search")}</span>
        </button>

        {isSignedIn ? (
          <div className="flex items-center gap-1">
            <NotificationsTrigger
              active={view === "notifications"}
              onClick={() => select("notifications")}
              label={t("notifications")}
            />
            <AccountTrigger
              active={view === "account"}
              onClick={() => select("account")}
              label={t("account")}
            />
          </div>
        ) : (
          <CheckInButton className="size-12 rounded-full" />
        )}
      </div>
      {/* iOS keyboard focus-keeper. See `onSearch` above for the
          rationale. Must be a real, focusable, off-page (not
          display:none) input with font-size >= 16px so iOS doesn't
          zoom the viewport when it receives focus. Hidden from
          assistive tech because it's purely a focus-transport device. */}
      <input
        ref={focusKeeperRef}
        type="search"
        readOnly
        aria-hidden="true"
        tabIndex={-1}
        // Tailwind utilities don't reliably hit the 16px iOS threshold
        // here (the project's 10px rem makes `text-base` = 10px), so
        // an explicit px font-size guards against the focus-zoom rule.
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          fontSize: "16px",
          pointerEvents: "none"
        }}
      />
    </m.nav>,
    portalTarget
  );
};

const LeftZone = ({
  hasRadio,
  themeLabel
}: {
  hasRadio: boolean;
  themeLabel: string;
}) => {
  if (hasRadio) {
    // PlayPauseButton owns its own click → useRadioControls.toggle().
    // Wrapped in a 48×48 frame to match adjacent tap targets.
    return (
      <span className="inline-flex size-12 items-center justify-center">
        <PlayPauseButton size={44} />
      </span>
    );
  }
  return <ThemeButton label={themeLabel} />;
};

const ThemeButton = ({ label }: { label: string }) => {
  const toggleTheme = useTheme((s) => s.toggleTheme);
  const theme = useTheme((s) => s.theme);
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={toggleTheme}
      className={ZONE_BTN}
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-5" strokeWidth={1.5} />
      ) : (
        <Moon aria-hidden="true" className="size-5" strokeWidth={1.5} />
      )}
    </button>
  );
};

const NotificationsTrigger = ({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => {
  const { notifications } = useNotifications();
  const unread = useMemo(
    () => notifications.filter((n) => !n.read && !n.dismissed).length,
    [notifications]
  );
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(ZONE_BTN, "relative", active && ZONE_BTN_ACTIVE)}
    >
      <Bell aria-hidden="true" className="size-5" strokeWidth={1.5} />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-2 right-2 inline-flex min-w-[18px] items-center justify-center",
            "rounded-full bg-nav-foreground px-1 py-0.5",
            "font-mono text-[10px] leading-none text-nav-background tabular-nums"
          )}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
};

const AccountTrigger = ({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => {
  const sessionUser = useRPSession(
    useShallow((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      image: r.image,
      displayUsername: r.displayUsername
    }))
  );
  const hasAvatar = Boolean(sessionUser.image);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-full",
        "touch-manipulation transition-all active:scale-[0.96]",
        active
          ? "ring-2 ring-nav-foreground/60"
          : "ring-1 ring-nav-foreground/40"
      )}
    >
      {hasAvatar ? (
        <UserAvatar
          user={{
            id: sessionUser.id,
            name: sessionUser.name ?? sessionUser.displayUsername ?? "",
            email: sessionUser.email ?? "",
            image: sessionUser.image ?? undefined
          }}
          className="size-9 rounded-full"
        />
      ) : (
        <UserRound
          aria-hidden="true"
          className="size-5 text-nav-foreground/75"
          strokeWidth={1.5}
        />
      )}
    </button>
  );
};
