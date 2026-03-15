import { Point } from '@/src/entities/operator/model/point';

export interface StateSnapshot {
  position: Point;
  fieldCopy: string[][];
  hasKey: boolean;
  hasExited: boolean;
}

export interface GridPoint {
  x: number;
  y: number;
}

export type FieldGrid = string[][];
