import * as migration_20250922_120041 from './20250922_120041';

export const migrations = [
  {
    up: migration_20250922_120041.up,
    down: migration_20250922_120041.down,
    name: '20250922_120041'
  },
];
