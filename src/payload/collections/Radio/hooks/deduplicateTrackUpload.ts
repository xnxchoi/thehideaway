import type { CollectionBeforeOperationHook } from "payload";

export const deduplicateTrackUpload: CollectionBeforeOperationHook = async ({
  operation,
  req,
  args
}) => {
  if (operation !== "update" || !req.file) return;

  const docId = (args as Record<string, unknown>).id as string | undefined;
  if (!docId) return;

  try {
    const existing = await req.payload.findByID({
      collection: "tracks",
      id: docId,
      depth: 0,
      overrideAccess: true,
      select: { filesize: true, mimeType: true } as never
    });

    if (!existing) return;

    const existingSize = (existing as Record<string, unknown>).filesize as
      | number
      | undefined;
    const existingMime = (existing as Record<string, unknown>).mimeType as
      | string
      | undefined;

    if (
      typeof existingSize === "number" &&
      existingSize === req.file.size &&
      existingMime === req.file.mimetype
    ) {
      req.file = undefined;
    }
  } catch {
    // Can't verify — let upload proceed normally
  }
};
