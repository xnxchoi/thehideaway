"use server";
import type { GlobalAfterChangeHook } from "payload";

export const revalidateFooter: GlobalAfterChangeHook = async ({
  doc,
  req: { payload }
}) => {
  payload.logger.info(`Revalidating footer`);

  return doc;
};
