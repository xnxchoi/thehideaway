import * as migration_20251208_072416 from "./20251208_072416";
import * as migration_20251208_073234 from "./20251208_073234";
import * as migration_20251209_125612 from "./20251209_125612";
import * as migration_20251211_140758 from "./20251211_140758";
import * as migration_20251211_141212 from "./20251211_141212";
import * as migration_20251211_150712 from "./20251211_150712";
import * as migration_20251223_152928 from "./20251223_152928";

export const migrations = [
	{
		up: migration_20251208_072416.up,
		down: migration_20251208_072416.down,
		name: "20251208_072416",
	},
	{
		up: migration_20251208_073234.up,
		down: migration_20251208_073234.down,
		name: "20251208_073234",
	},
	{
		up: migration_20251209_125612.up,
		down: migration_20251209_125612.down,
		name: "20251209_125612",
	},
	{
		up: migration_20251211_140758.up,
		down: migration_20251211_140758.down,
		name: "20251211_140758",
	},
	{
		up: migration_20251211_141212.up,
		down: migration_20251211_141212.down,
		name: "20251211_141212",
	},
	{
		up: migration_20251211_150712.up,
		down: migration_20251211_150712.down,
		name: "20251211_150712",
	},
	{
		up: migration_20251223_152928.up,
		down: migration_20251223_152928.down,
		name: "20251223_152928"
	},
];
