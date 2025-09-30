import { CollectionAfterOperationHook } from "payload";

/**
 * Hook to handle WebP conversion completion timing for image search plugin compatibility
 * This ensures that upload fields properly validate after WebP conversion is complete
 */
export const webpConversionHook: CollectionAfterOperationHook = async ({
  operation,
  result,
  req
}) => {
  // Handle WebP conversion completion for image search plugin compatibility
  if (operation === "create" && result && req.file) {
    // Small delay to ensure WebP conversion is complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Trigger a re-fetch of the document to get the updated WebP URLs
    if (
      typeof result === "object" &&
      "id" in result &&
      result.id &&
      typeof result.id === "string"
    ) {
      try {
        const updatedDoc = await req.payload.findByID({
          collection: "media",
          id: result.id,
          overrideAccess: true
        });

        // Update the result with the properly converted document
        Object.assign(result, updatedDoc);
      } catch (error) {
        req.payload.logger.warn(
          `Failed to re-fetch media document after WebP conversion: ${error}`
        );
      }
    }
  }
  return result;
};
