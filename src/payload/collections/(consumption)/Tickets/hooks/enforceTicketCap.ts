import type { CollectionBeforeValidateHook } from "payload";

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

export const enforceTicketCap: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation
}) => {
  if (operation !== "create") return data;
  if (!data) return data;

  const eventId = idOf(data.event);
  const userId = idOf(data.user);
  if (!eventId || !userId) return data;

  const event = (await req.payload
    .findByID({
      collection: "events",
      id: eventId,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null)) as { max_per_user?: number } | null;

  const cap = event?.max_per_user ?? 3;

  const existing = await req.payload.count({
    collection: "tickets",
    overrideAccess: true,
    where: {
      and: [
        { event: { equals: eventId } },
        { user: { equals: userId } },
        { status: { in: ["pending", "active", "used"] } }
      ]
    }
  });

  if ((existing.totalDocs ?? 0) >= cap) {
    throw new Error(`Per-user ticket cap reached (${cap}) for this event.`);
  }

  return data;
};
