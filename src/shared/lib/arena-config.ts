import { generateMap, STATIC_FIELD } from '@/src/entities/field';
import type { FieldGrid, GridPoint } from '@/src/shared/model';

export type ArenaMapType = 'static' | 'random' | 'custom';
export type ArenaGameMode = 'race' | 'duel';

export interface ArenaMapConfig {
  gameMode: ArenaGameMode;
  mapType: ArenaMapType;
  width: number;
  height: number;
  grid: FieldGrid;
  spawn1: GridPoint;
  spawn2: GridPoint;
}

export const DEFAULT_STATIC_SPAWN_1: GridPoint = { x: 2, y: 1 };
export const DEFAULT_STATIC_SPAWN_2: GridPoint = { x: 3, y: 4 };

function cloneGrid(grid: FieldGrid): FieldGrid {
  return grid.map((row) => [...row]);
}

function isGridPoint(value: unknown): value is GridPoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as GridPoint).x === 'number' &&
    typeof (value as GridPoint).y === 'number'
  );
}

function isFieldGrid(value: unknown): value is FieldGrid {
  return (
    Array.isArray(value) &&
    value.every(
      (row) => Array.isArray(row) && row.every((cell) => typeof cell === 'string'),
    )
  );
}

export function buildStaticArenaMapConfig(
  gameMode: ArenaGameMode = 'race',
): ArenaMapConfig {
  return {
    gameMode,
    mapType: 'static',
    width: STATIC_FIELD[0]?.length ?? 0,
    height: STATIC_FIELD.length,
    grid: cloneGrid(STATIC_FIELD),
    spawn1: DEFAULT_STATIC_SPAWN_1,
    spawn2: DEFAULT_STATIC_SPAWN_2,
  };
}

export function buildRandomArenaMapConfig(
  width: number,
  height: number,
  gameMode: ArenaGameMode = 'race',
): ArenaMapConfig {
  const { grid, spawn1, spawn2 } = generateMap(width, height);

  return {
    gameMode,
    mapType: 'random',
    width: grid[0]?.length ?? width,
    height: grid.length,
    grid,
    spawn1,
    spawn2,
  };
}

export function buildCustomArenaMapConfig({
  grid,
  spawn1,
  spawn2,
  gameMode = 'duel',
}: {
  grid: FieldGrid;
  spawn1: GridPoint;
  spawn2: GridPoint;
  gameMode?: ArenaGameMode;
}): ArenaMapConfig {
  return {
    gameMode,
    mapType: 'custom',
    width: grid[0]?.length ?? 0,
    height: grid.length,
    grid: cloneGrid(grid),
    spawn1,
    spawn2,
  };
}

export function normalizeArenaMapConfig(
  value: unknown,
  fallback: ArenaMapConfig = buildStaticArenaMapConfig(),
): ArenaMapConfig {
  if (typeof value !== 'object' || value === null) {
    return fallback;
  }

  const candidate = value as Partial<ArenaMapConfig>;

  if (
    (candidate.gameMode !== 'race' && candidate.gameMode !== 'duel') ||
    (candidate.mapType !== 'static' &&
      candidate.mapType !== 'random' &&
      candidate.mapType !== 'custom') ||
    !isFieldGrid(candidate.grid) ||
    !isGridPoint(candidate.spawn1) ||
    !isGridPoint(candidate.spawn2)
  ) {
    return fallback;
  }

  return {
    gameMode: candidate.gameMode,
    mapType: candidate.mapType,
    width: candidate.grid[0]?.length ?? candidate.width ?? fallback.width,
    height: candidate.grid.length || candidate.height || fallback.height,
    grid: cloneGrid(candidate.grid),
    spawn1: candidate.spawn1,
    spawn2: candidate.spawn2,
  };
}
