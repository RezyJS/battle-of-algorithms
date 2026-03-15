'use client';

import { create } from 'zustand';
import { validateReachability } from '@/src/entities/field';
import { MAP_SIZE_LIMITS, useGameStore } from './game-store';
import { FieldContent } from '@/src/shared/model';
import type { FieldGrid, GridPoint } from '@/src/shared/model';

export type BrushType =
  | 'wall'
  | 'empty'
  | 'key1'
  | 'key2'
  | 'exit'
  | 'spawn1'
  | 'spawn2';

export interface BrushOption {
  type: BrushType;
  label: string;
  icon: string;
  hotkey: string;
}

export const BRUSH_OPTIONS: BrushOption[] = [
  { type: 'wall', label: 'Стена', icon: '🧱', hotkey: '1' },
  { type: 'empty', label: 'Пустота', icon: '·', hotkey: '2' },
  { type: 'key1', label: 'Ключ 1', icon: '🔑', hotkey: '3' },
  { type: 'key2', label: 'Ключ 2', icon: '🗝️', hotkey: '4' },
  { type: 'exit', label: 'Выход', icon: '🚪', hotkey: '5' },
  { type: 'spawn1', label: 'Спавн 1', icon: '🔴', hotkey: '6' },
  { type: 'spawn2', label: 'Спавн 2', icon: '🟢', hotkey: '7' },
];

const UNIQUE_TOOLS: BrushType[] = ['key1', 'key2', 'exit', 'spawn1', 'spawn2'];

function clampWidth(width: number): number {
  return Math.max(
    MAP_SIZE_LIMITS.minWidth,
    Math.min(MAP_SIZE_LIMITS.maxWidth, width),
  );
}

function clampHeight(height: number): number {
  return Math.max(
    MAP_SIZE_LIMITS.minHeight,
    Math.min(MAP_SIZE_LIMITS.maxHeight, height),
  );
}

function isPerimeterCell(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return x === 0 || y === 0 || x === width - 1 || y === height - 1;
}

function createGrid(width: number, height: number): FieldGrid {
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      isPerimeterCell(x, y, width, height)
        ? FieldContent.WALL
        : FieldContent.EMPTY,
    ),
  );
}

function cloneGrid(grid: FieldGrid): FieldGrid {
  return grid.map((row) => [...row]);
}

function findPoint(grid: FieldGrid, value: string): GridPoint | null {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === value) {
        return { x, y };
      }
    }
  }

  return null;
}

function findAllPoints(grid: FieldGrid, values: string[]): GridPoint[] {
  const matches: GridPoint[] = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (values.includes(grid[y][x])) {
        matches.push({ x, y });
      }
    }
  }

  return matches;
}

function sanitizeGrid(grid: FieldGrid): FieldGrid {
  return grid.map((row) =>
    row.map((cell) =>
      cell === 'spawn1' || cell === 'spawn2' ? FieldContent.EMPTY : cell,
    ),
  );
}

function resizeGrid(grid: FieldGrid, width: number, height: number): FieldGrid {
  const nextGrid = createGrid(width, height);
  const currentHeight = grid.length;
  const currentWidth = grid[0]?.length ?? 0;
  const maxX = Math.min(currentWidth - 2, width - 2);
  const maxY = Math.min(currentHeight - 2, height - 2);

  for (let y = 1; y <= maxY; y++) {
    for (let x = 1; x <= maxX; x++) {
      nextGrid[y][x] = grid[y][x];
    }
  }

  return nextGrid;
}

function clearUniqueTool(grid: FieldGrid, tool: BrushType) {
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[y].length - 1; x++) {
      if (grid[y][x] === tool) {
        grid[y][x] = FieldContent.EMPTY;
      }
    }
  }
}

interface MapEditorState {
  grid: FieldGrid;
  width: number;
  height: number;
  activeTool: BrushType;
  validationError: string | null;

  initGrid: (width: number, height: number) => void;
  paintCell: (x: number, y: number) => void;
  setTool: (tool: BrushType) => void;
  resize: (width: number, height: number) => void;
  clear: () => void;
  validate: () => boolean;
  applyToGame: () => void;
}

const initialWidth = MAP_SIZE_LIMITS.minWidth;
const initialHeight = MAP_SIZE_LIMITS.minHeight;

export const useMapEditorStore = create<MapEditorState>((set, get) => ({
  grid: createGrid(initialWidth, initialHeight),
  width: initialWidth,
  height: initialHeight,
  activeTool: 'wall',
  validationError: null,

  initGrid: (width, height) => {
    const nextWidth = clampWidth(width);
    const nextHeight = clampHeight(height);

    set({
      grid: createGrid(nextWidth, nextHeight),
      width: nextWidth,
      height: nextHeight,
      validationError: null,
    });
  },

  paintCell: (x, y) => {
    const { grid, width, height, activeTool } = get();

    if (isPerimeterCell(x, y, width, height)) {
      return;
    }

    const nextGrid = cloneGrid(grid);

    if (UNIQUE_TOOLS.includes(activeTool)) {
      clearUniqueTool(nextGrid, activeTool);
    }

    nextGrid[y][x] =
      activeTool === 'empty' ? FieldContent.EMPTY : activeTool;

    set({
      grid: nextGrid,
      validationError: null,
    });
  },

  setTool: (tool) => {
    set({ activeTool: tool });
  },

  resize: (width, height) => {
    const nextWidth = clampWidth(width);
    const nextHeight = clampHeight(height);
    const { grid } = get();

    set({
      grid: resizeGrid(grid, nextWidth, nextHeight),
      width: nextWidth,
      height: nextHeight,
      validationError: null,
    });
  },

  clear: () => {
    const { width, height } = get();

    set({
      grid: createGrid(width, height),
      validationError: null,
    });
  },

  validate: () => {
    const { grid, width, height } = get();
    const spawn1 = findPoint(grid, 'spawn1');
    const spawn2 = findPoint(grid, 'spawn2');
    const exit = findPoint(grid, 'exit');
    const keys = findAllPoints(grid, ['key1', 'key2']);

    if (!spawn1 || !spawn2) {
      set({ validationError: 'Нужно поставить ровно 2 точки спавна.' });
      return false;
    }

    if (keys.length === 0) {
      set({ validationError: 'Нужно поставить хотя бы один ключ.' });
      return false;
    }

    if (!exit) {
      set({ validationError: 'Нужно поставить ровно один выход.' });
      return false;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (
          isPerimeterCell(x, y, width, height) &&
          grid[y][x] !== FieldContent.WALL
        ) {
          set({ validationError: 'Периметр карты должен состоять из стен.' });
          return false;
        }
      }
    }

    const sanitizedGrid = sanitizeGrid(grid);
    const reachability = validateReachability(
      sanitizedGrid,
      [spawn1, spawn2],
      [
        ...keys.map((key) => ({
          point: key,
          label: `ключа ${grid[key.y][key.x] === 'key1' ? '1' : '2'}`,
        })),
        { point: exit, label: 'выхода' },
      ],
    );

    if (!reachability.isValid) {
      set({
        validationError: `Спавн ${reachability.spawnIndex! + 1} не может добраться до ${reachability.targetLabel}.`,
      });
      return false;
    }

    set({ validationError: null });
    return true;
  },

  applyToGame: () => {
    if (!get().validate()) {
      return;
    }

    const { grid } = get();
    const spawn1 = findPoint(grid, 'spawn1');
    const spawn2 = findPoint(grid, 'spawn2');

    if (!spawn1 || !spawn2) {
      set({ validationError: 'Не удалось определить точки спавна.' });
      return;
    }

    useGameStore
      .getState()
      .setCustomMap(sanitizeGrid(grid), spawn1, spawn2);

    set({ validationError: null });
  },
}));
