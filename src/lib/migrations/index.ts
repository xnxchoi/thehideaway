import * as migration_20251006_025158 from './20251006_025158';
import * as migration_20251006_140354 from './20251006_140354';
import * as migration_20251006_182906 from './20251006_182906';
import * as migration_20251010_172301 from './20251010_172301';
import * as migration_20251013_104155 from './20251013_104155';
import * as migration_20251013_115431 from './20251013_115431';
import * as migration_20251013_162428 from './20251013_162428';
import * as migration_20251019_124110 from './20251019_124110';
import * as migration_20251021_171627 from './20251021_171627';
import * as migration_20251024_122759 from './20251024_122759';

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
    name: '20251006_182906',
  },
  {
    up: migration_20251010_172301.up,
    down: migration_20251010_172301.down,
    name: '20251010_172301',
  },
  {
    up: migration_20251013_104155.up,
    down: migration_20251013_104155.down,
    name: '20251013_104155',
  },
  {
    up: migration_20251013_115431.up,
    down: migration_20251013_115431.down,
    name: '20251013_115431',
  },
  {
    up: migration_20251013_162428.up,
    down: migration_20251013_162428.down,
    name: '20251013_162428',
  },
  {
    up: migration_20251019_124110.up,
    down: migration_20251019_124110.down,
    name: '20251019_124110',
  },
  {
    up: migration_20251021_171627.up,
    down: migration_20251021_171627.down,
    name: '20251021_171627',
  },
  {
    up: migration_20251024_122759.up,
    down: migration_20251024_122759.down,
    name: '20251024_122759'
  },
];
