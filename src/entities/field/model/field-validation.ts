import { FieldContent } from '@/src/shared/model';
import type { FieldGrid, GridPoint } from '@/src/shared/model';

export interface ReachabilityTarget {
  point: GridPoint;
  label: string;
}

export interface ReachabilityValidationResult {
  isValid: boolean;
  spawnIndex: number | null;
  targetLabel: string | null;
}

function getVisitedCells(grid: FieldGrid, start: GridPoint): Set<string> {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const queue: GridPoint[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ] as const) {
      const nextX = current.x + dx;
      const nextY = current.y + dy;
      const key = `${nextX},${nextY}`;

      if (
        nextX < 0 ||
        nextX >= width ||
        nextY < 0 ||
        nextY >= height ||
        visited.has(key) ||
        grid[nextY][nextX] === FieldContent.WALL
      ) {
        continue;
      }

      visited.add(key);
      queue.push({ x: nextX, y: nextY });
    }
  }

  return visited;
}

export function validateReachability(
  grid: FieldGrid,
  spawns: GridPoint[],
  targets: ReachabilityTarget[],
): ReachabilityValidationResult {
  for (let spawnIndex = 0; spawnIndex < spawns.length; spawnIndex++) {
    const spawn = spawns[spawnIndex];
    const visited = getVisitedCells(grid, spawn);

    for (const target of targets) {
      if (!visited.has(`${target.point.x},${target.point.y}`)) {
        return {
          isValid: false,
          spawnIndex,
          targetLabel: target.label,
        };
      }
    }
  }

  return {
    isValid: true,
    spawnIndex: null,
    targetLabel: null,
  };
}
