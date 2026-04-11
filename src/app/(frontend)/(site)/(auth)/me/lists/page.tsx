import { currentUser } from "@/lib/auth/context/get-context-props";
import { getUserCompilations } from "@/payload/collections/Compilations/actions";
import { redirect } from "next/navigation";
import ListsPageClient from "./page.client";

export const metadata = { title: "My Lists" };

export default async function ListsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const compilations = await getUserCompilations();

  return (
    <ListsPageClient
      userId={user.id}
      role={(user as any).role ?? "user"}
      compilations={compilations}
    />
  );
}
