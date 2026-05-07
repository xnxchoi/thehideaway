"use server";

import { getPayload } from "@/lib/payload";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function deleteCitationAction(id: string): Promise<void> {
  const payload = await getPayload();
  const reqHeaders = await headers();
  const { user } = await payload.auth({ headers: reqHeaders });
  if (!user) throw new Error("Unauthorized");
  await payload.delete({
    collection: "citations",
    id,
    user,
    overrideAccess: false
  });
  revalidatePath("/me/settings/highlights");
}

export async function setCitationPrivacyAction(
  id: string,
  isPrivate: boolean
): Promise<void> {
  const payload = await getPayload();
  const reqHeaders = await headers();
  const { user } = await payload.auth({ headers: reqHeaders });
  if (!user) throw new Error("Unauthorized");
  await payload.update({
    collection: "citations",
    id,
    user,
    overrideAccess: false,
    data: { private: isPrivate }
  });
  revalidatePath("/me/settings/highlights");
}
