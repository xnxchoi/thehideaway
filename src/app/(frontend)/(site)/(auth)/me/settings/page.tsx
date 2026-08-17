import { cookies } from "next/headers";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  currentUser,
  getDeviceSessions
} from "@/lib/auth/context/get-context-props";
import type { User } from "@payload-types";
import { readLocaleCookie } from "@/i18n/cookie";

import SettingsHubClient from "./page.client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsHubPage() {
  const user = (await currentUser()) as User | null;
  if (!user) return redirect("/sign-in?next=/me/settings");

  // Ambient counts surface as glanceable status, never as informational
  // copy below the legibility floor. Failure here degrades to "0 active"
  // — never blocks the hub.
  const sessions = await getDeviceSessions();
  const activeSessionsCount =
    sessions?.filter((s) => Boolean(s?.userAgent)).length ?? 0;

  const cookieStore = await cookies();
  const initialLocale = readLocaleCookie(cookieStore, "en");

  return (
    <SettingsHubClient
      user={user}
      initialLocale={initialLocale}
      activeSessionsCount={activeSessionsCount}
    />
  );
}
