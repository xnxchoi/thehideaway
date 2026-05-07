export type SettingsSectionSlug =
  | "profile"
  | "account"
  | "security"
  | "connected"
  | "notifications"
  | "appearance"
  | "highlights"
  | "subscriptions";

export interface SettingsSection {
  slug: SettingsSectionSlug;
  label: string;
  number: string;
  blurb: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    slug: "profile",
    label: "Profile",
    number: "01",
    blurb: "Your public face — name, handle, bio, location, link."
  },
  {
    slug: "account",
    label: "Account",
    number: "02",
    blurb: "Email, password, language, timezone."
  },
  {
    slug: "security",
    label: "Security",
    number: "03",
    blurb: "Two-factor, active sessions, account closure."
  },
  {
    slug: "connected",
    label: "Connected",
    number: "04",
    blurb: "OAuth providers and passkeys."
  },
  {
    slug: "notifications",
    label: "Notifications",
    number: "05",
    blurb: "What you hear from us — and how often."
  },
  {
    slug: "appearance",
    label: "Appearance",
    number: "06",
    blurb: "Theme, motion, language."
  },
  {
    slug: "highlights",
    label: "Highlights",
    number: "07",
    blurb: "Annotations and notes you've made across the site."
  },
  {
    slug: "subscriptions",
    label: "Subscriptions",
    number: "08",
    blurb: "Membership tier and billing."
  }
];

export const getSection = (slug: SettingsSectionSlug): SettingsSection => {
  const found = SETTINGS_SECTIONS.find((s) => s.slug === slug);
  if (!found) throw new Error(`Unknown settings section: ${slug}`);
  return found;
};
