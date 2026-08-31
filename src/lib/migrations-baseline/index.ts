import * as migration_20260815_102815 from "./20260815_102815";
import * as migration_20260831_120000_uncategorized_category from "./20260831_120000_uncategorized_category";

export const migrations = [
  {
    up: migration_20260815_102815.up,
    down: migration_20260815_102815.down,
    name: "20260815_102815"
  },
  {
    up: migration_20260831_120000_uncategorized_category.up,
    down: migration_20260831_120000_uncategorized_category.down,
    name: "20260831_120000_uncategorized_category"
  }
];
