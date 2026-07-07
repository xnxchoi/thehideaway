/**
 * Deterministic Seoul-night city layout for the fragrance scene.
 * Pure data — the scene module turns these into three.js objects.
 * All randomness is seeded so the street never re-rolls between mounts.
 */

export type LostFragranceBuilding = {
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
};

export type LostFragranceWindow = {
  buildingIndex: number;
  x: number;
  y: number;
  z: number;
  /** warm interior vs cool fluorescent */
  warm: boolean;
};

export type LostFragranceSign = {
  buildingIndex: number;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  color: string;
};

export const LOST_FRAGRANCE_MAX_WINDOWS = 640;

const BUILDING_COUNT = 16;
const WINDOW_MARGIN = 0.45;
const WINDOW_CELL_W = 0.52;
const WINDOW_CELL_H = 0.68;
const WINDOW_ON_PROBABILITY = 0.34;
const FACE_OFFSET = 0.02;

/** Same seeded PRNG family as the scene module. */
function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function getLostFragranceBuildings(): LostFragranceBuilding[] {
  const buildings: LostFragranceBuilding[] = [];
  for (let i = 0; i < BUILDING_COUNT; i += 1) {
    const width = 1.6 + seeded(i, 1) * 3.4;
    const height = 4 + seeded(i, 2) * 14;
    const depth = 1.6 + seeded(i, 3) * 3;
    const side = i % 2 === 0 ? -1 : 1;
    buildings.push({
      depth,
      height,
      width,
      x: side * (7 + seeded(i, 4) * 14),
      z: -6 - seeded(i, 5) * 26
    });
  }
  return buildings;
}

export function getLostFragranceWindows(
  buildings: LostFragranceBuilding[] = getLostFragranceBuildings()
): LostFragranceWindow[] {
  const windows: LostFragranceWindow[] = [];
  for (
    let buildingIndex = 0;
    buildingIndex < buildings.length;
    buildingIndex += 1
  ) {
    const building = buildings[buildingIndex];
    const cols = Math.max(
      1,
      Math.floor((building.width - WINDOW_MARGIN * 2) / WINDOW_CELL_W)
    );
    const rows = Math.max(
      1,
      Math.floor((building.height - WINDOW_MARGIN * 2) / WINDOW_CELL_H)
    );
    const gridWidth = cols * WINDOW_CELL_W;
    const gridHeight = rows * WINDOW_CELL_H;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cell = buildingIndex * 971 + row * 31 + col;
        if (seeded(cell, 21) > WINDOW_ON_PROBABILITY) continue;
        if (windows.length >= LOST_FRAGRANCE_MAX_WINDOWS) return windows;
        windows.push({
          buildingIndex,
          warm: seeded(cell, 22) < 0.6,
          x:
            building.x -
            gridWidth / 2 +
            WINDOW_CELL_W / 2 +
            col * WINDOW_CELL_W,
          y:
            WINDOW_MARGIN +
            WINDOW_CELL_H / 2 +
            row * WINDOW_CELL_H +
            (building.height - gridHeight - WINDOW_MARGIN * 2) / 2,
          z: building.z + building.depth / 2 + FACE_OFFSET
        });
      }
    }
  }
  return windows;
}

/** Hand-placed neon signage — the light events the ground reflects. */
const SIGN_DEFS: Array<{
  buildingIndex: number;
  color: string;
  width: number;
  height: number;
  /** vertical placement as a fraction of building height */
  yFraction: number;
  /** horizontal offset from building centre, in half-width fractions */
  xFraction: number;
}> = [
  {
    buildingIndex: 1,
    color: "#ff3d7f",
    height: 2.6,
    width: 0.5,
    xFraction: -0.4,
    yFraction: 0.42
  },
  {
    buildingIndex: 3,
    color: "#2de2e6",
    height: 0.5,
    width: 2.4,
    xFraction: 0,
    yFraction: 0.55
  },
  {
    buildingIndex: 5,
    color: "#ffb45e",
    height: 1.8,
    width: 0.45,
    xFraction: 0.45,
    yFraction: 0.3
  },
  {
    buildingIndex: 8,
    color: "#ff5a3c",
    height: 0.45,
    width: 1.9,
    xFraction: -0.2,
    yFraction: 0.62
  },
  {
    buildingIndex: 10,
    color: "#4f8fff",
    height: 2.2,
    width: 0.5,
    xFraction: 0.35,
    yFraction: 0.38
  },
  {
    buildingIndex: 13,
    color: "#e8ded2",
    height: 0.4,
    width: 1.6,
    xFraction: 0,
    yFraction: 0.5
  }
];

export function getLostFragranceSigns(
  buildings: LostFragranceBuilding[] = getLostFragranceBuildings()
): LostFragranceSign[] {
  return SIGN_DEFS.flatMap((def) => {
    const building = buildings[def.buildingIndex];
    if (!building) return [];
    return [
      {
        buildingIndex: def.buildingIndex,
        color: def.color,
        height: def.height,
        width: def.width,
        x: building.x + (building.width / 2) * def.xFraction,
        y: Math.min(
          building.height * def.yFraction,
          building.height - def.height / 2
        ),
        z: building.z + building.depth / 2 + FACE_OFFSET * 2
      }
    ];
  });
}
