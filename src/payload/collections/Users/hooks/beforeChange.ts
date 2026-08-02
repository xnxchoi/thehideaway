import type { User } from "@/payload-types";
import { sanitizeNameValues } from "@/utilities/sanitizeNameValues";
import type { CollectionBeforeChangeHook } from "payload";

export const beforeChangeUsers: CollectionBeforeChangeHook<User> = async ({
  originalDoc,
  data,
  operation
}) => {
  if (operation !== "update" || !originalDoc) return data;

  const firstName = data.firstName
    ? sanitizeNameValues(data.firstName)
    : originalDoc.firstName;
  const lastName = data.lastName
    ? sanitizeNameValues(data.lastName)
    : originalDoc.lastName;

  return {
    ...data,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`
  };
};
