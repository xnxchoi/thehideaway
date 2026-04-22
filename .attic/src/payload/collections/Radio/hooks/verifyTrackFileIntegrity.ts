import { access } from "node:fs/promises";
import path from "node:path";
import type { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";

/**
 * Guards Tracks against a Payload admin-UI upload race:
 *
 * 1. User picks a file. Payload autosave fires with `req.file` → server writes
 *    the file to disk and persists `filename` in the draft row. Fine.
 * 2. Admin UI client-side state drifts (filename-field edit interrupted by a
 *    render, filename speculatively bumped, etc.). The next autosave POSTs a
 *    changed `data.filename` but WITHOUT `req.file`.
 * 3. Payload's `generateFileData` short-circuits on missing file for draft
 *    saves (`throwOnMissingFile` is false), returning `files: []` and passing
 *    through whatever filename the client sent — unmodified, unvalidated.
 * 4. `uploadFiles` is a no-op with an empty array. DB row gets updated with
 *    the new filename. Disk still has the previous filename. Silent mismatch.
 * 5. Anything downstream that builds a URL from `doc.filename` 404s.
 *
 * Pipeline timing (verified against payload/dist):
 *
 *   CREATE: generateFileData → beforeValidate → beforeChange ← hook runs here
 *           → uploadFiles → db.create
 *
 *   UPDATE: generateFileData → deleteAssociatedFiles → beforeValidate
 *           → uploadFiles → beforeChange ← hook runs here
 *           → beforeChange fields → db.update
 *
 * For UPDATE the new file is already on disk when we run, so `fs.access`
 * gives us the truth. For CREATE the file isn't written yet, so we rely on
 * `req.file` presence as the validity signal instead.
 *
 * Rejection is only safe when `req.file` is absent: at that point no side
 * effects have occurred yet. For UPDATE-with-file + mismatch (pathological
 * FS failure, not the client-drift bug), we still throw — leaving a minor
 * orphan-state risk — because silently committing a broken doc is worse.
 */
export const verifyTrackFileIntegrity: CollectionBeforeChangeHook = async ({
  req,
  data,
  operation,
  originalDoc,
  collection
}) => {
  if (!data?.filename || typeof data.filename !== "string") {
    return data;
  }

  // CREATE: beforeChange runs BEFORE uploadFiles, so disk isn't authoritative
  // yet. Trust `req.file`'s presence as the only signal of a legit upload.
  if (operation === "create") {
    if (req.file) return data;
    throw new APIError(
      `Track create: filename '${data.filename}' has no uploaded file. ` +
        `The admin UI sent a filename without a file buffer — this is the known ` +
        `autosave race. Re-upload the audio file and try again.`,
      400
    );
  }

  // UPDATE: uploadFiles has already run, so disk is authoritative.
  const staticDir =
    collection?.upload && typeof collection.upload === "object"
      ? collection.upload.staticDir
      : undefined;
  if (!staticDir) {
    req.payload.logger.warn(
      `verifyTrackFileIntegrity: tracks collection has no resolvable staticDir; skipping integrity check for '${data.filename}'.`
    );
    return data;
  }

  const diskPath = path.resolve(staticDir, data.filename);
  try {
    await access(diskPath);
    return data;
  } catch {
    // No side effects yet iff !req.file — safe to revert or reject.
    if (
      !req.file &&
      typeof originalDoc?.filename === "string" &&
      originalDoc.filename.length > 0 &&
      originalDoc.filename !== data.filename
    ) {
      const prevPath = path.resolve(staticDir, originalDoc.filename);
      try {
        await access(prevPath);
        req.payload.logger.warn(
          `verifyTrackFileIntegrity: track ${originalDoc.id} incoming filename ` +
            `'${data.filename}' has no file on disk; reverting to ` +
            `'${originalDoc.filename}' (client-drift guard).`
        );
        return { ...data, filename: originalDoc.filename };
      } catch {
        // originalDoc's file is also gone; fall through to throw.
      }
    }
    throw new APIError(
      `Track update: filename '${data.filename}' has no corresponding file on disk` +
        (req.file
          ? ` despite an upload attempt — filesystem may be out of sync.`
          : ` and no valid previous filename to revert to. The admin UI likely bumped the filename without re-uploading.`),
      400
    );
  }
};
