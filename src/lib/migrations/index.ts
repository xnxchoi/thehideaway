import * as migration_20260309_050036 from './20260309_050036';

export const migrations = [
  {
    up: migration_20260309_050036.up,
    down: migration_20260309_050036.down,
    name: '20260309_050036'
  },
];
