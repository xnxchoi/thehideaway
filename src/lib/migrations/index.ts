import * as migration_20260309_050036 from './20260309_050036';
import * as migration_20260316_044453 from './20260316_044453';
import * as migration_20260316_135700 from './20260316_135700';
import * as migration_20260319_155516 from './20260319_155516';
import * as migration_20260324_192442 from './20260324_192442';
import * as migration_20260330_084157 from './20260330_084157';
import * as migration_20260403_search_score from './20260403_search_score';

export const migrations = [
  {
    up: migration_20260309_050036.up,
    down: migration_20260309_050036.down,
    name: '20260309_050036',
  },
  {
    up: migration_20260316_044453.up,
    down: migration_20260316_044453.down,
    name: '20260316_044453',
  },
  {
    up: migration_20260316_135700.up,
    down: migration_20260316_135700.down,
    name: '20260316_135700',
  },
  {
    up: migration_20260319_155516.up,
    down: migration_20260319_155516.down,
    name: '20260319_155516',
  },
  {
    up: migration_20260324_192442.up,
    down: migration_20260324_192442.down,
    name: '20260324_192442',
  },
  {
    up: migration_20260330_084157.up,
    down: migration_20260330_084157.down,
    name: '20260330_084157'
  },
  {
    up: migration_20260403_search_score.up,
    down: migration_20260403_search_score.down,
    name: '20260403_search_score'
  },
];
