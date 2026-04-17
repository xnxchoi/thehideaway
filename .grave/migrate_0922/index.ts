import * as migration_20250915_164121 from "./20250915_164121";
// Temporarily commented out search migrations to isolate Drizzle adapter error
// import * as migration_20250916_multi_collection_search from './20250916_multi_collection_search';
// import * as migration_20250916_user_search_indexes from './20250916_user_search_indexes';
import * as migration_20250918_095455 from "./20250918_095455";
import * as migration_20250922_rollback_search_vectors from "./20250922_rollback_search_vectors";

export const migrations = [
  {
    up: migration_20250915_164121.up,
    down: migration_20250915_164121.down,
    name: "20250915_164121"
  },
  // Temporarily commented out search migrations to isolate Drizzle adapter error
  // {
  //   up: migration_20250916_multi_collection_search.up,
  //   down: migration_20250916_multi_collection_search.down,
  //   name: '20250916_multi_collection_search',
  // },
  // {
  //   up: migration_20250916_user_search_indexes.up,
  //   down: migration_20250916_user_search_indexes.down,
  //   name: '20250916_user_search_indexes',
  // },
  {
    up: migration_20250918_095455.up,
    down: migration_20250918_095455.down,
    name: "20250918_095455"
  },
  {
    up: migration_20250922_rollback_search_vectors.up,
    down: migration_20250922_rollback_search_vectors.down,
    name: "20250922_rollback_search_vectors"
  }
];
