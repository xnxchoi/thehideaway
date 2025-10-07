import * as migration_20251006_025158 from './20251006_025158';
import * as migration_20251006_140354 from './20251006_140354';
import * as migration_20251006_182906 from './20251006_182906';

export const migrations = [
  {
    up: migration_20251006_025158.up,
    down: migration_20251006_025158.down,
    name: '20251006_025158',
  },
  {
    up: migration_20251006_140354.up,
    down: migration_20251006_140354.down,
    name: '20251006_140354',
  },
  {
    up: migration_20251006_182906.up,
    down: migration_20251006_182906.down,
    name: '20251006_182906'
  },
];
