import * as migration_20251027_125323 from './20251027_125323';
import * as migration_20251027_151954 from './20251027_151954';
import * as migration_20251028_124539 from './20251028_124539';
import * as migration_20251028_140108 from './20251028_140108';
import * as migration_20251110_130405 from './20251110_130405';

export const migrations = [
  {
    up: migration_20251027_125323.up,
    down: migration_20251027_125323.down,
    name: '20251027_125323',
  },
  {
    up: migration_20251027_151954.up,
    down: migration_20251027_151954.down,
    name: '20251027_151954',
  },
  {
    up: migration_20251028_124539.up,
    down: migration_20251028_124539.down,
    name: '20251028_124539',
  },
  {
    up: migration_20251028_140108.up,
    down: migration_20251028_140108.down,
    name: '20251028_140108',
  },
  {
    up: migration_20251110_130405.up,
    down: migration_20251110_130405.down,
    name: '20251110_130405'
  },
];
