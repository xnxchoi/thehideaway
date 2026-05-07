import { currentUser } from "@/lib/auth/context/get-context-props";
import type { User } from "@/payload-types";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import HighlightsSectionClient from "./page.client";
import { queryUserCitations } from "./queryUserCitations";

export const metadata: Metadata = { title: "Highlights · Settings" };

export default async function HighlightsSettingsPage() {
  const user = (await currentUser()) as User | null;
  if (!user) return redirect("/sign-in?next=/me/settings/highlights");
  const citations = await queryUserCitations(user.id, 50);
  return <HighlightsSectionClient citations={citations} />;
}
