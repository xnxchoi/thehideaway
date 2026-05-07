"use server";

import { getPayload } from "@/lib/payload";
import type { Citation } from "@/payload-types";

export type UserCitation = Pick<
  Citation,
  | "id"
  | "quote"
  | "memo"
  | "private"
  | "selection"
  | "createdAt"
  | "updatedAt"
  | "target"
  | "reference"
  | "path"
>;

export async function queryUserCitations(
  userId: string,
  limit = 50
): Promise<UserCitation[]> {
  const payload = await getPayload();
  const res = await payload.find({
    collection: "citations",
    where: { author: { equals: userId } },
    sort: "-updatedAt",
    limit,
    pagination: false,
    overrideAccess: true,
    depth: 1,
    select: {
      id: true,
      quote: true,
      memo: true,
      private: true,
      selection: true,
      createdAt: true,
      updatedAt: true,
      target: true,
      reference: true,
      path: true
    }
  });
  return (res.docs ?? []) as UserCitation[];
}
