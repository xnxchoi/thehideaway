import * as migration_20251129_184401 from "./20251129_184401";
import * as migration_20251130_075410 from "./20251130_075410";
import * as migration_20251130_154352 from "./20251130_154352";
import * as migration_20251206_201212 from "./20251206_201212";
import * as migration_20251207_151333 from "./20251207_151333";
import * as migration_20251208_040754 from "./20251208_040754";
import * as migration_20251208_063049 from "./20251208_063049";
import * as migration_20251208_065612 from "./20251208_065612";
import * as migration_20251208_072124 from "./20251208_072124";

export const migrations = [
	{
		up: migration_20251129_184401.up,
		down: migration_20251129_184401.down,
		name: "20251129_184401",
	},
	{
		up: migration_20251130_075410.up,
		down: migration_20251130_075410.down,
		name: "20251130_075410",
	},
	{
		up: migration_20251130_154352.up,
		down: migration_20251130_154352.down,
		name: "20251130_154352",
	},
	{
		up: migration_20251206_201212.up,
		down: migration_20251206_201212.down,
		name: "20251206_201212",
	},
	{
		up: migration_20251207_151333.up,
		down: migration_20251207_151333.down,
		name: "20251207_151333",
	},
	{
		up: migration_20251208_040754.up,
		down: migration_20251208_040754.down,
		name: "20251208_040754",
	},
	{
		up: migration_20251208_063049.up,
		down: migration_20251208_063049.down,
		name: "20251208_063049",
	},
	{
		up: migration_20251208_065612.up,
		down: migration_20251208_065612.down,
		name: "20251208_065612",
	},
	{
		up: migration_20251208_072124.up,
		down: migration_20251208_072124.down,
		name: "20251208_072124"
	},
];
