import { initialize } from "./attic-lib.mjs";
import { resolve } from "node:path";

const root = resolve(process.env.ATTIC_DIR ?? ".attic");

const result = await initialize(root);
if (result.already) {
  console.log("attic: already initialized");
} else if (result.created) {
  console.log("attic: created .attic");
} else {
  const parts = [];
  if (result.lockedFiles) parts.push(`locked ${result.lockedFiles} file(s)`);
  if (result.fixedDirectories) parts.push(`made ${result.fixedDirectories} director(y/ies) writable`);
  console.log(`attic: initialized${parts.length ? ` (${parts.join(", ")})` : ""}`);
}
