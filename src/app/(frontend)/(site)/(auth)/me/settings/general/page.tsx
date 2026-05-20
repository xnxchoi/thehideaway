import { cookies } from "next/headers";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth/context/get-context-props";
import { readLocaleCookie } from "@/i18n/cookie";

import GeneralSectionClient from "./page.client";

export const metadata: Metadata = { title: "General · Settings" };

export default async function GeneralSettingsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings/general");

  const cookieStore = await cookies();
  const locale = readLocaleCookie(cookieStore, "en");

  return <GeneralSectionClient locale={locale} />;
}
