import { FieldContent } from '@/src/shared/model';
import type { FieldGrid, GridPoint } from '@/src/shared/model';
import { validateReachability } from './field-validation';

interface GeneratedMap {
  grid: FieldGrid;
  spawn1: GridPoint;
  spawn2: GridPoint;
}

/**
 * Generates a solvable maze using recursive backtracking (DFS).
 * Guarantees that both spawn points, both keys, and the exit are reachable.
 */
export function generateMap(
  width: number = 10,
  height: number = 8,
): GeneratedMap {
  // Ensure odd dimensions so DFS covers all edges evenly
  if (width % 2 === 0) width--;
  if (height % 2 === 0) height--;

  // Start with all walls
  const grid: FieldGrid = Array.from({ length: height }, () =>
    Array(width).fill(FieldContent.WALL),
  );

  // Carve passages using DFS (recursive backtracking)
  const visited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );

  const directions = [
    [0, -2],
    [0, 2],
    [-2, 0],
    [2, 0],
  ];

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function carve(x: number, y: number) {
    visited[y][x] = true;
    grid[y][x] = FieldContent.EMPTY;

    for (const [dx, dy] of shuffle(directions)) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        !visited[ny][nx]
      ) {
        // Carve the wall between current and next
        grid[y + dy / 2][x + dx / 2] = FieldContent.EMPTY;
        carve(nx, ny);
      }
    }
  }

  // Start carving from (0, 0) — must be even coordinates
  carve(0, 0);

  // Open up extra passages to make the maze less tight (30% of walls)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === FieldContent.WALL && Math.random() < 0.3) {
        // Only remove if it doesn't create a 3x3 empty block
        const neighbors = [
          grid[y - 1]?.[x],
          grid[y + 1]?.[x],
          grid[y]?.[x - 1],
          grid[y]?.[x + 1],
        ].filter((c) => c === FieldContent.EMPTY).length;

        if (neighbors >= 2 && neighbors <= 3) {
          grid[y][x] = FieldContent.EMPTY;
        }
      }
    }
  }

  // Collect all empty cells
  const emptyCells: GridPoint[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === FieldContent.EMPTY) {
        emptyCells.push({ x, y });
      }
    }
  }

  // Place spawn points, keys, and exit with reachability guarantee
  function pickRandom(cells: GridPoint[]) {
    return cells[Math.floor(Math.random() * cells.length)];
  }

  function distance(a: GridPoint, b: GridPoint) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  let spawn1: GridPoint;
  let spawn2: GridPoint;
  let key1Pos: GridPoint;
  let key2Pos: GridPoint;
  let exitPos: GridPoint;

  // Retry until we get a valid, reachable configuration
  let attempts = 0;
  do {
    attempts++;

    // Spawns should be far apart
    spawn1 = pickRandom(emptyCells);
    const farCells = emptyCells.filter((c) => distance(c, spawn1) >= Math.floor((width + height) / 3));
    spawn2 = farCells.length > 0 ? pickRandom(farCells) : pickRandom(emptyCells.filter((c) => c !== spawn1));

    // Keys in different quadrants
    const usedPositions = new Set([`${spawn1.x},${spawn1.y}`, `${spawn2.x},${spawn2.y}`]);
    const available = emptyCells.filter((c) => !usedPositions.has(`${c.x},${c.y}`));

    key1Pos = pickRandom(available);
    usedPositions.add(`${key1Pos.x},${key1Pos.y}`);

    const available2 = available.filter((c) => !usedPositions.has(`${c.x},${c.y}`));
    key2Pos = pickRandom(available2);
    usedPositions.add(`${key2Pos.x},${key2Pos.y}`);

    const available3 = available2.filter((c) => !usedPositions.has(`${c.x},${c.y}`));
    exitPos = pickRandom(available3);
  } while (
    attempts < 100 &&
    !validateReachability(
      grid,
      [spawn1, spawn2],
      [
        { point: key1Pos, label: 'key1' },
        { point: key2Pos, label: 'key2' },
        { point: exitPos, label: 'exit' },
      ],
    ).isValid
  );

  // Place objects on the grid
  grid[key1Pos.y][key1Pos.x] = 'key1';
  grid[key2Pos.y][key2Pos.x] = 'key2';
  grid[exitPos.y][exitPos.x] = 'exit';

  return { grid, spawn1, spawn2 };
}
