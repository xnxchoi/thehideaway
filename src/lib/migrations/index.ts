import * as migration_20250915_164121 from "./20250915_164121";
import * as migration_20250916_multi_collection_search from "./20250916_multi_collection_search";

export const migrations = [
  {
    up: migration_20250915_164121.up,
    down: migration_20250915_164121.down,
    name: "20250915_164121"
  },
  {
    up: migration_20250916_multi_collection_search.up,
    down: migration_20250916_multi_collection_search.down,
    name: "20250916_multi_collection_search"
  }
];
