import * as migration_20260309_050036 from "./20260309_050036";
import * as migration_20260316_135700 from "./20260316_135700";
import * as migration_20260319_155516 from "./20260319_155516";

export const migrations = [
  {
    up: migration_20260309_050036.up,
    down: migration_20260309_050036.down,
    name: "20260309_050036"
  },
  {
    up: migration_20260316_135700.up,
    down: migration_20260316_135700.down,
    name: "20260316_135700"
  },
  {
    up: migration_20260319_155516.up,
    down: migration_20260319_155516.down,
    name: "20260319_155516"
  }
];
