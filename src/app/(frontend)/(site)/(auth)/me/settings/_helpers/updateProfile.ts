"use client";

import { authClient } from "@/lib/auth/client";

type UpdatableUserField =
  | "name"
  | "firstName"
  | "lastName"
  | "bio"
  | "location"
  | "link"
  | "image"
  | "portrait";

export async function updateUserField(
  field: UpdatableUserField,
  value: string | null | undefined
): Promise<void> {
  const payload: Record<string, unknown> = {};
  payload[field] = value;
  const res = await authClient.updateUser(payload);
  if (res?.error) {
    throw new Error(res.error.message ?? `Couldn't update ${field}`);
  }
}
