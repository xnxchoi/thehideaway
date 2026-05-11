"use client";

import { format } from "date-fns";
import {
  BellIcon as Bell,
  ShieldCheckIcon as ShieldCheck,
  UserCircleIcon as UserRound,
  SlidersIcon as Sliders,
  IdentificationCardIcon as IdCard
} from "@phosphor-icons/react";
import {
  Masthead,
  QuickStrip,
  SectionGroup,
  SectionLink
} from "@/components/UX/Settings";
import { RPage } from "@/components/UX/Transition";
import type { User } from "@/payload-types";

interface SettingsHubClientProps {
  user: User;
  initialLocale: "en" | "ko";
  activeSessionsCount: number;
}

/**
 * Settings hub.
 *
 * macOS × iOS hybrid:
 *   - **xl+ (desktop)**: this page is the "overview pane" — Masthead +
 *     QuickStrip. The SectionGroup stack is hidden because the persistent
 *     rail (in layout.tsx) handles navigation.
 *   - **< xl (mobile / tablet)**: the rail collapses, so this page also
 *     carries the SectionGroup stack as the navigation surface (iOS
 *     Settings drill-down).
 *
 * Section grouping (axis-based, not feature-based):
 *   - Preferences   — General (interface)
 *   - You           — Profile (public-displayable), Account (administrative)
 *   - Access        — Security (credential protections)
 *   - Communication — Notifications
 *
 * Profile vs. Account is the load-bearing distinction: Profile holds
 * fields that get displayed publicly (name, bio, location, link); Account
 * holds fields that are administratively impactful (handle, sign-in
 * email, password, billing). Handle lives in Account because it's the
 * URL identity / mention target, not just a public face.
 */
export default function SettingsHubClient({
  user,
  initialLocale,
  activeSessionsCount
}: SettingsHubClientProps) {
  const displayName =
    user.name ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    "Member";

  const memberSince = user.createdAt
    ? `Member since ${format(new Date(user.createdAt), "MMM yyyy")}`
    : undefined;

  const roleLabel = formatRoleLabel(user.role);
  const handle = user.slug ?? null;
  const publicHref = handle ? `/@${handle}` : null;

  return (
    <RPage
      type="account"
      slug={[]}
      className="w-full"
      internalClassName="w-full"
    >
      <div className="flex w-full flex-col gap-10 xl:gap-12">
        <Masthead
          displayName={displayName}
          imageSrc={user.image ?? null}
          handle={handle}
          email={user.email}
          roleLabel={roleLabel}
          memberSince={memberSince}
          publicHref={publicHref}
        />

        <QuickStrip
          initialLocale={initialLocale}
          twoFactorEnabled={Boolean(user.twoFactorEnabled)}
          activeSessionsCount={activeSessionsCount}
        />

        {/* Mobile/tablet only: hub-as-navigation. Desktop uses the rail
            in layout.tsx, so showing this stack on xl+ would just
            duplicate it. */}
        <div className="flex flex-col gap-10 xl:hidden">
          <SectionGroup label="Preferences">
            <SectionLink
              href="/me/settings/general"
              title="General"
              description="Language, theme, and other interface preferences."
              tone="data"
              icon={<Sliders size={14} strokeWidth={1.4} />}
            />
          </SectionGroup>

          <SectionGroup label="You">
            <SectionLink
              href="/me/settings/profile"
              title="Profile"
              description="Public-facing fields — name, bio, location, link."
              tone="account"
              icon={<UserRound size={14} strokeWidth={1.4} />}
            />
            <SectionLink
              href="/me/settings/account"
              title="Account"
              description="Handle, sign-in email, password, address, subscriptions."
              tone="billing"
              icon={<IdCard size={14} strokeWidth={1.4} />}
            />
          </SectionGroup>

          <SectionGroup label="Access">
            <SectionLink
              href="/me/settings/security"
              title="Security"
              description="Two-factor, sessions, providers, passkeys, danger zone."
              tone="support"
              icon={<ShieldCheck size={14} strokeWidth={1.4} />}
            />
          </SectionGroup>

          <SectionGroup label="Communication">
            <SectionLink
              href="/me/settings/notifications"
              title="Notifications"
              description="What you hear from us — and how often."
              tone="options"
              icon={<Bell size={14} strokeWidth={1.4} />}
            />
          </SectionGroup>
        </div>
      </div>
    </RPage>
  );
}

function formatRoleLabel(role: User["role"]): string | undefined {
  switch (role) {
    case "admin":
      return "Concierge";
    case "editor":
      return "Editor";
    case "author":
      return "Author";
    case "patron":
      return "Patron";
    case "member":
      return "Member";
    case "user":
      return "Reader";
    default:
      return undefined;
  }
}
