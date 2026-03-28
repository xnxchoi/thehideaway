import { ensureHandleIsUnique } from "@/payload/collections/Users/endpoints/ensureHandleIsUnique";
import { createCuid } from "@/utilities/stringUtilities";
import { User } from "@payload-types";
import type { FieldHook } from "payload";
import { generateSmartSlugCandidates } from "./smartGenerateHandles";

export const formatHandle = formatUserHandle;
export function formatUserHandleLite(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]/g, "") // 1. remove invalid chars (Instagram: letters, digits, periods, underscores only)
    .replace(/\.+/g, "."); // 2. collapse consecutive dots
}

export function formatUserHandleMinimal(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]/g, "") // 1. remove invalid characters
    .replace(/\.+/g, ".") // 2. collapse consecutive dots
    .replace(/^([\.-]+)(?=[_a-z0-9])/, "")
    .replace(/(?<=[a-z0-9_])([\.-]+)$/, "");
}

export function formatUserHandle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]/g, "") // 1. remove invalid characters
    .replace(/\.+/g, ".") // 2. collapse consecutive dots

    .replace(/((?<![a-z0-9.])){1,2}(\.)+(?=[a-z0-9])/g, ".") // 3. remove dots not between alphanumerics
    .replace(/(?<=[a-z0-9])(\.)+(?![a-z0-9.]){1,2}/g, ".") // 4. Once more, remove dots not between alphanumerics
    .replace(/^\.*/g, "") // 5. remove leading dots
    .replace(/\.*$/g, "") // 6. remove trailing dots
    .slice(0, 30); // 7. max length
}

export const HANDLE_TEST_REGEX =
  /^(?!.*\.\.)(?!.*[A-Z])(?!.*\.$)[^\W][\w.]{0,29}$/;

export const formatUserHandleHook: FieldHook<User, User["slug"]> = async ({
  data,
  operation,
  siblingData,
  originalDoc,
  value,
  previousValue,
  overrideAccess,
  req
}) => {
  let toValue = value;
  if (!toValue) {
    if (operation === "update") {
      toValue = previousValue || originalDoc?.slug;
    }
    if (!toValue) {
      if (data?.email) {
        toValue = data.email.split("@")[0];
      }
    }
  }
  if (!toValue) {
    throw new Error("No value provided.");
  }
  const handle = formatUserHandle(toValue);

  if (handle.length > 2) {
    const { valid, handle: h } = await ensureHandleIsUnique({ handle });
    if (valid && !!h) {
      return h;
    }
  }
  /** if handle is longer than 2 charcters and has passed the uniqueness check, function has already returned the value at this point */
  /** If the operation is update we fall back to the previous value*/
  if (operation === "update") {
    const alt = previousValue || originalDoc?.slug;
    if (typeof alt === "string") {
      /** formatting again for safety... */
      const fin = formatUserHandle(alt);
      if (fin.length > 2 && fin !== handle) {
        /** If the formatted value is different from the current value, we return it (length is accounted for since we require alt to be longer than 2 characters) */
        return fin;
      }
    }
  }
  /** Either the operation is create, or the previous value didn't pass the test at this point */
  const tg = (operation === "update" && originalDoc) || data;
  const candidates = generateSmartSlugCandidates({
    base: handle,
    maxAttempts: 5,
    ...(tg && {
      email: tg.email,
      firstName: tg.firstName,
      lastName: tg.lastName,
      displayUsername: tg.displayUsername
    })
  });
  const base = {
    ...((operation === "update" && originalDoc && { user: originalDoc.id }) ||
      {})
  };
  for (const candidate of candidates) {
    const { valid: exists } = await ensureHandleIsUnique({
      handle: candidate,
      ...base
    });
    if (!exists) {
      return candidate;
    }
  }
  /** This is a true limbo; client-side validation was somehow bypassed, the smart generation didn't work... (highly unlikely at early stages of the platform)  */
  /** This is where the random generation begins */
  /** We generate a random UUID, format it and check back for uniqueness... maximum retry 3 times*/
  let isOkay = false;
  let retry = 0;
  let newHandle = formatUserHandle(createCuid());
  while (!isOkay && retry < 3) {
    newHandle = formatUserHandle(createCuid());
    if (newHandle.length > 2) {
      continue;
    }
    const r = await ensureHandleIsUnique({ handle: newHandle });
    isOkay = r.valid;
    retry++;
  }
  if (isOkay) {
    return newHandle;
  }
  /** If we fail to generate a unique handle, we throw an error */
  throw new Error("Failed to generate a unique handle");
};
