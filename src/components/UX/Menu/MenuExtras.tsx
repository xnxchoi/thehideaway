"use client";

import { Link } from "@/components/core/Link/Link";
import { PlayPauseButton } from "@/components/UX/TapePlayer";
import { UserAvatar } from "@/lib/auth/betterauth-ui/src";
import { signOut } from "@/lib/auth/client";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import {
  useHasRadio,
  useNowPlaying,
  usePlayState
} from "@/providers/HideawayFM/hooks";
import { useNotifications } from "@/providers/Notifications";
import { useRPStore, useSearchBar } from "@/providers/RP_Pro";
import {
  Bell,
  LogOut,
  Search as SearchIcon,
  Settings as SettingsIcon,
  UserRound
} from "lucide-react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

/**
 * MenuExtras — the four feature blocks integrated into the full-screen Menu.
 *
 * Mounts inside the existing `menu__noti-scroller` slot in `RP_Menu`. Renders
 * a vertical stack of compact rows that fold the Controlbar's surfaces
 * (search, notifications, account, now-playing) into the canonical mobile
 * menu so the user has a single discoverable surface.
 *
 * Visibility: each row gates itself on the relevant precondition
 * (signed-in, hasRadio, etc.). The whole component only paints when
 * `navIsOpen` is true; otherwise it's invisible / non-interactive.
 *
 * Routing: rows that route close the menu first by clearing `navIsOpen`
 * before navigating, so the menu doesn't sit on top of the destination.
 */
export const MenuExtras = () => {
  const navIsOpen = useRPStore(useShallow((r) => r.navIsOpen));
  const setNavIsOpen = useRPStore((r) => r.setNavIsOpen);
  const isSignedIn = useRPSession(useShallow((r) => Boolean(r.id)));
  const hasRadio = useHasRadio();

  const closeMenu = useCallback(() => {
    setNavIsOpen(false);
  }, [setNavIsOpen]);

  return (
    <m.div
      aria-hidden={!navIsOpen}
      className={cn(
        // The .menu__noti-scroller container is positioned for us. We
        // override its horizontal-scroll default with a vertical stack
        // and a comfortable max-width so rows don't sprawl on tablet.
        "flex w-full max-w-[640px] flex-col gap-3 px-6 pb-2",
        // Fade with the menu; the menu's own AnimatePresence handles the
        // outer mount/unmount, so we just need opacity + pointer-events
        // that follow nav state. When closed, rows are non-interactive so
        // ghost-clicks can't fire from behind other surfaces.
        navIsOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
        "transition-opacity duration-300"
      )}
    >
      <SearchRow onClose={closeMenu} />
      {hasRadio && <NowPlayingRow onClose={closeMenu} />}
      {isSignedIn && <NotificationsRow onClose={closeMenu} />}
      {isSignedIn && <AccountBlock onClose={closeMenu} />}
    </m.div>
  );
};

// ─── Search ──────────────────────────────────────────────────────────────────

const SearchRow = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations("Controlbar");
  const setSearchOpen = useSearchBar((l) => l.setOpen);
  const handleClick = useCallback(() => {
    onClose();
    setSearchOpen(true);
  }, [onClose, setSearchOpen]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("search")}
      className={cn(
        "group flex h-12 w-full items-center gap-3 rounded-full px-4",
        "border border-border/30 bg-foreground/[0.04]",
        "touch-manipulation transition-colors",
        "active:bg-foreground/[0.08]"
      )}
    >
      <SearchIcon
        aria-hidden="true"
        className="size-[18px] text-foreground/65"
        strokeWidth={1.5}
      />
      <span className="flex-1 text-left font-sans text-sm font-normal text-foreground/65">
        {t("search")}
      </span>
    </button>
  );
};

// ─── Now playing ─────────────────────────────────────────────────────────────

const NowPlayingRow = ({ onClose }: { onClose: () => void }) => {
  const { track } = useNowPlaying();
  const { optimistic } = usePlayState();
  const isPlaying = optimistic === "playing";

  if (!track) return null;

  const title = track.title || "Hideaway Radio";
  const artist = track.artist;

  return (
    <div
      className={cn(
        "flex h-14 w-full items-center gap-3 rounded-2xl px-3",
        "border border-border/20 bg-foreground/[0.03]"
      )}
    >
      <Link
        href="/radio"
        onClick={onClose}
        className="flex min-w-0 flex-1 flex-col gap-0.5"
        aria-label={`Now playing: ${title}${artist ? ` by ${artist}` : ""}`}
      >
        <span className="truncate font-sans text-sm font-medium tracking-tight text-foreground">
          {title}
        </span>
        {artist && (
          <span className="truncate font-mono text-[10px] tracking-wider text-foreground/55 uppercase">
            {artist}
          </span>
        )}
        <span className="sr-only" role="status" aria-live="polite">
          {isPlaying ? "Playing" : "Paused"}
        </span>
      </Link>
      <PlayPauseButton size={36} />
    </div>
  );
};

// ─── Notifications ───────────────────────────────────────────────────────────

const NotificationsRow = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations("Controlbar");
  const { notifications } = useNotifications();
  const unread = useMemo(
    () => notifications.filter((n) => !n.read && !n.dismissed).length,
    [notifications]
  );
  const preview = useMemo(() => {
    const sorted = [...notifications]
      .filter((n) => !n.dismissed)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return sorted[0] ?? null;
  }, [notifications]);

  return (
    <Link
      href="/me/notifications"
      onClick={onClose}
      aria-label={
        unread > 0
          ? `${t("notifications")} — ${unread} unread`
          : t("notifications")
      }
      className={cn(
        "group flex h-14 w-full items-center gap-3 rounded-2xl px-3",
        "border border-border/20 bg-foreground/[0.03]",
        "touch-manipulation transition-colors",
        "active:bg-foreground/[0.05]"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex size-9 flex-none items-center justify-center rounded-full",
          "bg-foreground/[0.05] text-foreground/75"
        )}
      >
        <Bell className="size-[18px]" strokeWidth={1.5} />
        {unread > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 inline-flex min-w-[18px] items-center justify-center",
              "rounded-full bg-foreground px-1 py-0.5",
              "font-mono text-[10px] leading-none text-background tabular-nums"
            )}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-sans text-sm font-medium tracking-tight text-foreground">
          {t("notifications")}
        </span>
        <span className="truncate font-sans text-[12px] text-foreground/55">
          {preview?.title || preview?.content || "Up to date"}
        </span>
      </span>
    </Link>
  );
};

// ─── Account ─────────────────────────────────────────────────────────────────

const AccountBlock = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations("Controlbar");
  const sessionUser = useRPSession(
    useShallow((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      image: r.image,
      displayUsername: r.displayUsername
    }))
  );

  const onSignOut = useCallback(async () => {
    onClose();
    await signOut();
  }, [onClose]);

  const displayName =
    sessionUser.name ?? sessionUser.displayUsername ?? sessionUser.email ?? "";
  const avatarUser = useMemo(
    () => ({
      id: sessionUser.id,
      name: displayName,
      email: sessionUser.email ?? "",
      image: sessionUser.image ?? undefined
    }),
    [sessionUser, displayName]
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-2xl p-3",
        "border border-border/20 bg-foreground/[0.03]"
      )}
    >
      <div className="flex items-center gap-3">
        {sessionUser.image ? (
          <UserAvatar
            user={avatarUser}
            className="size-10 flex-none rounded-full ring-1 ring-border/30"
          />
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex size-10 flex-none items-center justify-center rounded-full bg-foreground/[0.06] ring-1 ring-border/30"
          >
            <UserRound
              className="size-[18px] text-foreground/65"
              strokeWidth={1.5}
            />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-sans text-sm font-medium tracking-tight text-foreground">
            {displayName || "Hideaway member"}
          </span>
          {sessionUser.email && (
            <span className="truncate font-mono text-[11px] text-foreground/55">
              {sessionUser.email}
            </span>
          )}
        </span>
      </div>
      <div className="flex w-full items-stretch gap-1.5 pt-1">
        <AccountAction
          href={`/@${sessionUser.displayUsername || ""}`}
          label={t("profile")}
          icon={<UserRound className="size-[14px]" strokeWidth={1.5} />}
          onClose={onClose}
        />
        <AccountAction
          href="/me/settings"
          label={t("settings")}
          icon={<SettingsIcon className="size-[14px]" strokeWidth={1.5} />}
          onClose={onClose}
        />
        <button
          type="button"
          onClick={onSignOut}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2",
            "border border-border/30 bg-transparent",
            "touch-manipulation transition-colors",
            "active:bg-foreground/[0.05]"
          )}
          aria-label={t("signOut")}
        >
          <LogOut
            aria-hidden="true"
            className="size-[14px] text-foreground/65"
            strokeWidth={1.5}
          />
          <span className="font-sans text-[11px] font-medium tracking-tight text-foreground/85">
            {t("signOut")}
          </span>
        </button>
      </div>
    </div>
  );
};

const AccountAction = ({
  href,
  label,
  icon,
  onClose
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClose: () => void;
}) => (
  <Link
    href={href}
    onClick={onClose}
    aria-label={label}
    className={cn(
      "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2",
      "border border-border/30 bg-transparent",
      "touch-manipulation transition-colors",
      "active:bg-foreground/[0.05]"
    )}
  >
    <span aria-hidden="true" className="text-foreground/65">
      {icon}
    </span>
    <span className="font-sans text-[11px] font-medium tracking-tight text-foreground/85">
      {label}
    </span>
  </Link>
);
