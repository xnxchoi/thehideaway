import * as migration_20250922_120041 from './20250922_120041';
import * as migration_20250925_111558 from './20250925_111558';
import * as migration_20250927_162602 from './20250927_162602';
import * as migration_20250928_195131 from './20250928_195131';

export const migrations = [
  {
    up: migration_20250922_120041.up,
    down: migration_20250922_120041.down,
    name: '20250922_120041',
  },
  {
    up: migration_20250925_111558.up,
    down: migration_20250925_111558.down,
    name: '20250925_111558',
  },
  {
    up: migration_20250927_162602.up,
    down: migration_20250927_162602.down,
    name: '20250927_162602',
  },
  {
    up: migration_20250928_195131.up,
    down: migration_20250928_195131.down,
    name: '20250928_195131'
  },
];
