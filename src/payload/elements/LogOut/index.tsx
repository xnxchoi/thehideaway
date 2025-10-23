"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Link } from "@/components/UX/Link/Link";
import type { User } from "@/payload-types";
import { useRPNav, useUserBarNav } from "@/payload/providers/Admins";
import { useIsMobile } from "@/providers/MiddleMan";
import { Avatar } from "@base-ui-components/react";
import { Button, useAuth, useConfig, useTranslation } from "@payloadcms/ui";
import { useLenis } from "lenis/react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Sparkles
} from "lucide-react";
import { formatAdminURL } from "payload/shared";
import { useCallback, useEffect } from "react";

export const LogoutButton = () => {
  const open = useUserBarNav((r) => r.open);
  const setOpen = useUserBarNav((r) => r.setOpen);
  const { t } = useTranslation();
  const { config } = useConfig();
  const { isMobile } = useIsMobile();
  const { user: u } = useAuth();

  const lenis = useLenis();

  const onEnter = useCallback(() => {
    lenis?.stop();
  }, [lenis]);
  const onLeave = useCallback(() => {
    lenis?.start();
  }, [lenis]);
  const {
    admin: {
      routes: { logout: logoutRoute }
    },
    routes: { admin: adminRoute }
  } = config;
  if (!u || u.collection === "admins") return <></>;
  const user = u as User & { collection: "users" };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          style={{
            position: "absolute",

            bottom: "10px",
            right: "10px",
            left: "10px",
            borderRadius: "10px",
            zIndex: 12,
            background: "transparent",
            border: "none",
            color: "oklch(var(--faded-fg) / 1)",
            width: "auto",
            padding: "6px 4px",
            outline: "none",
            backdropFilter: "blur(2px)",
            boxShadow: "0 0 1px 1px oklch(var(--muted-faded-bg) / .35)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Avatar.Root
            className="h-[32px] w-[32px] rounded-lg"
            style={{
              display: "inline-block",
              overflow: "hidden"
            }}
          >
            <Avatar.Image
              src={(user && "image" in user && user.image && user.image) || ""}
              alt={user?.name}
            />

            <Avatar.Fallback className="rounded-lg">SN</Avatar.Fallback>
          </Avatar.Root>
          <div
            style={{ fontFamily: "var(--font-sans)" }}
            className="grid flex-1 text-start text-sm leading-tight"
          >
            <span
              style={{ fontFamily: "var(--font-sans)" }}
              className="truncate font-medium"
            >
              {user?.name}
            </span>
            <span
              style={{ fontFamily: "var(--font-sans)" }}
              className="truncate text-xs"
            >
              {user?.email}
            </span>
          </div>
          <ChevronsUpDown className="ms-auto size-[16px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="w-(--radix-dropdown-menu-trigger-width) min-w-[224px] rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
        style={{
          outline: "1px groove oklch(var(--muted-faded-fg)/.2)",
          backgroundColor: "oklch(var(--off-bg)/0.2)",
          backdropFilter: "blur(2px)",
          fontFamily: "var(--font-sans)"
        }}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-[8px] px-[4px] py-[6px] text-start text-sm">
            <Avatar.Root
              className="h-[32px] w-[32px] rounded-lg"
              style={{
                display: "inline-block",
                overflow: "hidden"
              }}
            >
              <Avatar.Image src={user.image || ""} alt={user.name} />
              <Avatar.Fallback className="rounded-lg">SN</Avatar.Fallback>
            </Avatar.Root>
            <div
              style={{ fontFamily: "var(--font-sans)" }}
              className="grid flex-1 text-start text-sm leading-tight"
            >
              <span
                style={{ fontFamily: "var(--font-sans)" }}
                className="truncate font-medium"
              >
                {user.name}
              </span>
              <span
                style={{ fontFamily: "var(--font-sans)" }}
                className="truncate text-xs"
              >
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator
          style={{
            backgroundColor: "oklch(var(--muted-faded-fg)/.2)"
          }}
        />
        {user.role === "user" && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link prefetch={false} href="/plans">
                Upgrade Membership
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link prefetch={false} href="/vault/account">
              Account
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link prefetch={false} href="/me/notifications">
              Notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            prefetch={false}
            href={formatAdminURL({
              adminRoute,
              path: logoutRoute
            })}
          >
            Check Out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
