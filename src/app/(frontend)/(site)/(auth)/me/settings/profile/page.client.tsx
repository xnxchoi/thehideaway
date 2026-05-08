"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/components/core/Link/Link";
import {
  EditableField,
  EditableLink,
  EditableLocation,
  LockedField,
  Panel,
  PanelControls,
  PanelGrid,
  PanelHeader
} from "@/components/UX/Settings";
import type { User } from "@/payload-types";
import { ArrowUpRight } from "lucide-react";
import { searchPlaces } from "../_helpers/searchPlaces";
import { updateUserField } from "../_helpers/updateProfile";
import { RPage } from "@/components/UX/Transition";

interface ProfileSectionClientProps {
  user: User;
}

export default function ProfileSectionClient({
  user
}: ProfileSectionClientProps) {
  const displayName =
    user.name ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    "Member";

  const initial = (displayName || user.email || "·").trim().charAt(0);

  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        {/* Identity card — public-facing preview. Kept on the GlassPanel
            primitive for v1; the dedicated MembershipPlate (Plaque-driven)
            ships in Stage 4a. */}
        <Panel>
          <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-start sm:gap-8 xl:p-9">
            <Avatar className="h-24 w-24 shrink-0 rounded-lg outline outline-1 -outline-offset-1 outline-foreground/20 sm:h-28 sm:w-28">
              {user.image ? (
                <AvatarImage
                  src={user.image}
                  alt={displayName}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="rounded-lg bg-foreground/[0.06] text-2xl font-light text-foreground/65">
                  {initial.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-xs font-medium tracking-tight text-foreground/55 dark:text-foreground/50">
                Member
              </p>
              <h2 className="text-3xl font-light tracking-tight sm:text-4xl xl:text-5xl">
                {displayName}
              </h2>
              {user.slug ? (
                <p className="text-sm text-foreground/65 dark:text-foreground/60">
                  @{user.slug}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/65 dark:text-foreground/60">
                {user.location ? <span>{user.location}</span> : null}
                {user.link ? (
                  <a
                    href={user.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-foreground/85"
                  >
                    {user.link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ArrowUpRight size={11} />
                  </a>
                ) : null}
              </div>
            </div>

            {user.slug ? (
              <Link
                href={`/@${user.slug}`}
                className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-xs text-foreground/55 transition-colors hover:text-foreground sm:static sm:self-start"
              >
                View public
                <ArrowUpRight size={11} />
              </Link>
            ) : null}
          </div>
        </Panel>

        {/* Identity — merged: name pair + bio together. Per the
            breakpoint-2 audit, splitting bio into a solo "Voice" panel
            read as padding (1:1 panel-to-row ratio). The three fields
            share a conceptual home — "who you are" — and a single
            multi-row panel is tighter information architecture. */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Identity"
              title="Your real-world name and voice"
              blurb="Shown on your profile and in bylines. Display name is auto-derived from first and last."
            />
            <PanelControls>
              <EditableField
                label="First name"
                value={user.firstName ?? ""}
                emptyHint="First name"
                maxLength={48}
                onSave={(v) => updateUserField("firstName", v)}
              />
              <EditableField
                label="Last name"
                value={user.lastName ?? ""}
                emptyHint="Last name"
                maxLength={48}
                onSave={(v) => updateUserField("lastName", v)}
              />
              <EditableField
                label="Bio"
                description="A short line shown on your public profile. 240 characters."
                align="stack"
                multiline
                rows={3}
                value={user.bio ?? ""}
                emptyHint="A member of The Hideaway."
                maxLength={240}
                onSave={(v) => updateUserField("bio", v)}
              />
            </PanelControls>
          </PanelGrid>
        </Panel>

        {/* Locator */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Locator"
              title="Where to find you"
              blurb="Both fields are public. The link is displayed without the protocol."
            />
            <PanelControls>
              {/* Location uses the autocomplete-aware primitive. The
                  searchPlaces helper hits our /api/places/search proxy,
                  which holds the Mapbox secret token and filters to
                  city-grade results only. */}
              <EditableLocation
                label="Location"
                value={user.location ?? ""}
                emptyHint="Seoul"
                searchPlaces={searchPlaces}
                onSave={(v) => updateUserField("location", v)}
              />
              <EditableLink
                label="Link"
                value={user.link ?? ""}
                emptyHint="https://"
                onSave={(v) => updateUserField("link", v)}
              />
            </PanelControls>
          </PanelGrid>
        </Panel>

        {/* Visibility */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Visibility"
              title="How you appear in search"
              blurb="Your handle is the URL you live at. Renaming opens in a later release."
            />
            <PanelControls>
              <LockedField
                label="Handle"
                description="Your unique URL."
                value={`@${user.slug ?? "—"}`}
                reason="Renaming the handle is in preparation."
              />
              <LockedField
                label="Email"
                description="Where account-critical messages go."
                value={user.email}
                reason="Editing your sign-in email is in preparation."
              />
            </PanelControls>
          </PanelGrid>
        </Panel>
      </div>
    </RPage>
  );
}
