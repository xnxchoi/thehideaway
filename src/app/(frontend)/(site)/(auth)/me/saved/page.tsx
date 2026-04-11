import { currentUser } from "@/lib/auth/context/get-context-props";
import { getUserBookmarkedItems } from "@/payload/collections/Compilations/actions";
import { redirect } from "next/navigation";
import SavedPageClient from "./page.client";

export const metadata = { title: "Saved" };

export default async function SavedPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const items = await getUserBookmarkedItems();

  return <SavedPageClient userId={user.id} items={items} />;
}
