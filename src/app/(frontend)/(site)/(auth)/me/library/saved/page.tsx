import { currentUser } from "@/lib/auth/context/get-context-props";
import { getUserBookmarkedItems } from "@/payload/collections/Compilations/actions";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SavedPageClient from "./page.client";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <Suspense>
      <SavedBody />
    </Suspense>
  );
}

async function SavedBody() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const items = await getUserBookmarkedItems();

  return <SavedPageClient userId={user.id} items={items} />;
}
