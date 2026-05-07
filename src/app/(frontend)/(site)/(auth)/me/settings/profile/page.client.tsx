"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/components/core/Link/Link";
import {
  EditableText,
  EditorialButton,
  GlassPanel,
  SettingsGroup,
  SettingsHeader,
  SettingsRow,
  getSection
} from "@/components/UX/Settings";
import type { User } from "@/payload-types";
import { ArrowUpRight } from "lucide-react";
import { updateUserField } from "../_helpers/updateProfile";
import { RPage } from "@/components/UX/Transition";

interface ProfileSectionClientProps {
  user: User;
}

const section = getSection("profile");

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
        <SettingsHeader section={section} />

        {/* Identity card — public-facing preview */}
        <GlassPanel variant="elevated" as="section">
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8 xl:p-10">
            <Avatar className="h-20 w-20 shrink-0 rounded-sm outline outline-1 -outline-offset-1 outline-border/30 sm:h-24 sm:w-24">
              {user.image ? (
                <AvatarImage
                  src={user.image}
                  alt={displayName}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="rounded-sm bg-foreground/[0.04] font-mono text-xl font-light text-foreground/60">
                  {initial.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <p className="font-mono text-[10px] tracking-[0.22em] text-foreground/55 uppercase">
                Public profile
              </p>
              <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
                {displayName}
              </h2>
              {user.slug ? (
                <p className="font-mono text-[11px] tracking-wider text-foreground/60">
                  @{user.slug}
                </p>
              ) : null}
              {user.bio ? (
                <p className="max-w-prose text-sm leading-relaxed font-light text-foreground/70">
                  {user.bio}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.18em] text-foreground/65 uppercase dark:text-foreground/60">
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
                className="absolute top-6 right-6 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-foreground/55 uppercase transition-colors hover:text-foreground sm:static sm:self-start"
              >
                View public
                <ArrowUpRight size={11} />
              </Link>
            ) : null}
          </div>
        </GlassPanel>

        {/* Identity */}
        <SettingsGroup
          title="Identity"
          description="Your real-world name. Shown on your profile and in bylines."
        >
          <SettingsRow label="First name">
            <EditableText
              initialValue={user.firstName ?? ""}
              emptyHint="First name"
              maxLength={48}
              onSave={(v) => updateUserField("firstName", v)}
            />
          </SettingsRow>
          <SettingsRow label="Last name">
            <EditableText
              initialValue={user.lastName ?? ""}
              emptyHint="Last name"
              maxLength={48}
              onSave={(v) => updateUserField("lastName", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Display name"
            description="Shown wherever you're credited."
          >
            <EditableText
              initialValue={user.name ?? ""}
              emptyHint="Display name"
              maxLength={64}
              onSave={(v) => updateUserField("name", v)}
            />
          </SettingsRow>
        </SettingsGroup>

        {/* About */}
        <SettingsGroup
          title="About"
          description="A short line shown on your public profile. Be specific."
        >
          <SettingsRow label="Bio" align="stack">
            <EditableText
              multiline
              rows={3}
              initialValue={user.bio ?? ""}
              emptyHint="A member of The Hideaway."
              maxLength={240}
              onSave={(v) => updateUserField("bio", v)}
            />
          </SettingsRow>
        </SettingsGroup>

        {/* Location & link */}
        <SettingsGroup title="Where to find you">
          <SettingsRow label="Location">
            <EditableText
              initialValue={user.location ?? ""}
              emptyHint="Seoul"
              maxLength={64}
              onSave={(v) => updateUserField("location", v)}
            />
          </SettingsRow>
          <SettingsRow label="Link">
            <EditableText
              type="url"
              initialValue={user.link ?? ""}
              emptyHint="https://"
              maxLength={200}
              validate={(v) => {
                if (!v) return null;
                try {
                  const u = new URL(v.startsWith("http") ? v : `https://${v}`);
                  return u.hostname.includes(".") ? null : "Enter a valid URL";
                } catch {
                  return "Enter a valid URL";
                }
              }}
              onSave={(v) => updateUserField("link", v)}
            />
          </SettingsRow>
        </SettingsGroup>

        {/* Visibility */}
        <SettingsGroup
          title="Visibility"
          description="How you appear in search and on others' screens."
        >
          <SettingsRow
            label="Handle"
            description="Your unique URL. Renaming is in preparation."
            meta={
              <span className="text-foreground/60 dark:text-foreground/55">
                Locked
              </span>
            }
          >
            <span className="font-mono text-sm tracking-wide text-foreground/70">
              @{user.slug ?? "—"}
            </span>
          </SettingsRow>
          <SettingsRow label="Public profile">
            {user.slug ? (
              <Link href={`/@${user.slug}`}>
                <EditorialButton
                  tone="default"
                  icon={<ArrowUpRight size={12} />}
                >
                  View as public
                </EditorialButton>
              </Link>
            ) : (
              <span className="text-foreground/65">No handle yet</span>
            )}
          </SettingsRow>
        </SettingsGroup>
      </div>
    </RPage>
  );
}
