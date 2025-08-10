import * as migration_20250801_055924 from './20250801_055924';
import * as migration_20250802_113544 from './20250802_113544';
import * as migration_20250802_174402 from './20250802_174402';
import * as migration_20250802_182417 from './20250802_182417';

export const migrations = [
	{
		up: migration_20250801_055924.up,
		down: migration_20250801_055924.down,
		name: '20250801_055924',
	},
	{
		up: migration_20250802_113544.up,
		down: migration_20250802_113544.down,
		name: '20250802_113544',
	},
	{
		up: migration_20250802_174402.up,
		down: migration_20250802_174402.down,
		name: '20250802_174402',
	},
	{
		up: migration_20250802_182417.up,
		down: migration_20250802_182417.down,
		name: '20250802_182417'
	},
];
