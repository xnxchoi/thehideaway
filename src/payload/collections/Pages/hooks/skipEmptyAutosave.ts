import { APIError, type CollectionBeforeChangeHook } from "payload";

export const skipEmptyPageAutosave: CollectionBeforeChangeHook = ({
  data,
  operation,
  req
}) => {
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  if (title) return data;

  const autosave =
    req.query?.autosave === "true" || req.query?.autosave === true;
  if (autosave || operation === "create") {
    throw new APIError("Cannot save a page without a title.", 400);
  }
  return data;
};
