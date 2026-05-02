import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { getServerSession } from "@/lib/auth/getServerSession";
import MyTicketsPageClient, { type MyTicketDoc } from "./page.client";

export const metadata: Metadata = { title: "My Tickets" };

export default async function MyTicketsPage() {
  const session = await getServerSession(await nextHeaders());
  if (!session) {
    redirect("/login?redirect=/tickets/my");
  }

  const payload = await getPayload({ config });
  const userId = String(session.user.id);
  const found = await payload.find({
    collection: "tickets",
    where: { user: { equals: userId } },
    depth: 1,
    limit: 200,
    sort: "-createdAt",
    overrideAccess: true
  });
  const tickets = (found?.docs ?? []) as MyTicketDoc[];

  return <MyTicketsPageClient tickets={tickets} />;
}
