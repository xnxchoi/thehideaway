import { Admin, User } from "@payload-types";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/context/get-context-props";
import { getUserCompilations } from "@/payload/collections/Compilations/actions";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ListsPageClient from "./page.client";

export const generateMetadata = (): Metadata => ({ title: "My Lists" });

export default function ListsPage() {
  return (
    <Suspense>
      <ListsBody />
    </Suspense>
  );
}

async function ListsBody() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const compilations = await getUserCompilations();

  return (
    <ListsPageClient
      userId={user.id}
      role={(user as User | Admin).role ?? "user"}
      compilations={compilations}
    />
  );
}
