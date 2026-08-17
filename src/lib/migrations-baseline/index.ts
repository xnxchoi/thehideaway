import * as migration_20260815_102815 from "./20260815_102815";

export const migrations = [
  {
    up: migration_20260815_102815.up,
    down: migration_20260815_102815.down,
    name: "20260815_102815"
  }
];
