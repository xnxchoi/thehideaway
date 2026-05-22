import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { getServerSession } from "@/lib/auth/getServerSession";

export default async function EventEntryPage() {
  const session = await getServerSession(await nextHeaders());

  if (!session?.user?.id) {
    redirect("/sign-in?redirect=/tickets/day-n-night");
  }

  const userId = session.user.id;
  const payload = await getPayload({ config });

  const eventResult = await payload
    .find({
      collection: "events" as never,
      where: { slug: { equals: "day-n-night" } } as never,
      limit: 1,
      overrideAccess: true,
      depth: 0
    })
    .catch(() => null);

  const event = eventResult?.docs?.[0] as { id: string } | undefined;
  if (!event) redirect("/day-n-night");

  const ticketResult = await payload
    .count({
      collection: "tickets" as never,
      overrideAccess: true,
      where: {
        and: [
          { event: { equals: event.id } },
          {
            or: [
              { user: { equals: userId } },
              { purchaser: { equals: userId } }
            ]
          }
        ]
      } as never
    })
    .catch(() => null);

  if (ticketResult && ticketResult.totalDocs > 0) {
    redirect("/day-n-night/my");
  }

  redirect("/tickets/day-n-night");
}
