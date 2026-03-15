import { DirectionX, DirectionY, FieldContent } from '@/src/shared/model';
import type { StateSnapshot, FieldGrid } from '@/src/shared/model';
import { Point } from './point';

export class Operator {
  #coordinates: Point;
  #uid: string;
  #fieldCopy: FieldGrid;
  #hasKey = false;
  #hasExited = false;
  #history: StateSnapshot[] = [];
  #originalField: FieldGrid;
  #staticMap: FieldGrid;
  #stepCount = 0;
  #markedCells: Set<string> = new Set();
  #opponent: Operator | null = null;
  #isDuelMode = false;

  constructor(
    uid: string,
    field: FieldGrid,
    staticMap: FieldGrid,
    startX = 0,
    startY = 0,
  ) {
    this.#coordinates = new Point(startX, startY);
    this.#uid = uid;
    this.#staticMap = staticMap;
    this.#originalField = field.map((row) => [...row]);
    this.#fieldCopy = field.map((row) => [...row]);
    this._placeOnMap();
    this.#history.push(this._getCurrentState());
  }

  private _placeOnMap() {
    const x = this.#coordinates.getX();
    const y = this.#coordinates.getY();
    this.#fieldCopy[y][x] = this.#uid;
  }

  private _clearCurrentCell() {
    const x = this.#coordinates.getX();
    const y = this.#coordinates.getY();
    const original = this._originalContentAt(x, y);
    this.#fieldCopy[y][x] = original;
  }

  private _originalContentAt(x: number, y: number): string {
    return this.#staticMap[y][x];
  }

  getFieldCopy(): FieldGrid {
    return this.#fieldCopy;
  }

  getPosition() {
    return this.#coordinates;
  }

  getUID() {
    return this.#uid;
  }

  hasKey() {
    return this.#hasKey;
  }

  hasExited() {
    return this.#hasExited;
  }

  getHistory() {
    return this.#history;
  }

  getStepCount() {
    return this.#stepCount;
  }

  private _getCurrentState(): StateSnapshot {
    return {
      position: this.#coordinates.clone(),
      fieldCopy: this.#fieldCopy.map((row) => [...row]),
      hasKey: this.#hasKey,
      hasExited: this.#hasExited,
    };
  }

  reset(startX = 0, startY = 0) {
    this.#coordinates = new Point(startX, startY);
    this.#hasKey = false;
    this.#hasExited = false;
    this.#stepCount = 0;
    this.#markedCells = new Set();
    this.#fieldCopy = this.#originalField.map((row) => [...row]);
    this._placeOnMap();
    this.#history = [];
    this.#history.push(this._getCurrentState());
  }

  lookRight() {
    const right =
      this.#fieldCopy[this.#coordinates.getY()][this.#coordinates.getX() + 1];
    return (
      right !== undefined && right !== FieldContent.WALL && right !== 'wall'
    );
  }

  lookLeft() {
    const left =
      this.#fieldCopy[this.#coordinates.getY()][this.#coordinates.getX() - 1];
    return left !== undefined && left !== FieldContent.WALL && left !== 'wall';
  }

  lookUp() {
    const up =
      this.#fieldCopy[this.#coordinates.getY() - 1]?.[
        this.#coordinates.getX()
      ];
    return up !== undefined && up !== FieldContent.WALL && up !== 'wall';
  }

  lookDown() {
    const down =
      this.#fieldCopy[this.#coordinates.getY() + 1]?.[
        this.#coordinates.getX()
      ];
    return down !== undefined && down !== FieldContent.WALL && down !== 'wall';
  }

  private _move(dx: DirectionX, dy: DirectionY) {
    if (
      dx !== DirectionX.STAY &&
      this[`look${dx > 0 ? 'Right' : 'Left'}`]()
    ) {
      this._clearCurrentCell();
      this.#coordinates.changeX(dx);
      this._placeOnMap();
      this._pickUpIfNeeded();
    }
    if (
      dy !== DirectionY.STAY &&
      this[`look${dy > 0 ? 'Down' : 'Up'}`]()
    ) {
      this._clearCurrentCell();
      this.#coordinates.changeY(dy);
      this._placeOnMap();
      this._pickUpIfNeeded();
    }
  }

  moveRight() {
    this._move(DirectionX.RIGHT, DirectionY.STAY);
    this.#stepCount++;
    this.#history.push(this._getCurrentState());
  }

  moveLeft() {
    this._move(DirectionX.LEFT, DirectionY.STAY);
    this.#stepCount++;
    this.#history.push(this._getCurrentState());
  }

  moveUp() {
    this._move(DirectionX.STAY, DirectionY.TOP);
    this.#stepCount++;
    this.#history.push(this._getCurrentState());
  }

  moveDown() {
    this._move(DirectionX.STAY, DirectionY.DOWN);
    this.#stepCount++;
    this.#history.push(this._getCurrentState());
  }

  wait() {
    this.#stepCount++;
    this.#history.push(this._getCurrentState());
  }

  scan(radius: number = 1): string[][] {
    const x = this.#coordinates.getX();
    const y = this.#coordinates.getY();
    const result: string[][] = [];

    for (let dy = -radius; dy <= radius; dy++) {
      const row: string[] = [];
      for (let dx = -radius; dx <= radius; dx++) {
        const ny = y + dy;
        const nx = x + dx;
        if (
          ny >= 0 &&
          ny < this.#fieldCopy.length &&
          nx >= 0 &&
          nx < this.#fieldCopy[0].length
        ) {
          row.push(this.#fieldCopy[ny][nx]);
        } else {
          row.push('out_of_bounds');
        }
      }
      result.push(row);
    }
    return result;
  }

  markCell() {
    const x = this.#coordinates.getX();
    const y = this.#coordinates.getY();
    this.#markedCells.add(`${x},${y}`);
  }

  isMarked(dx = 0, dy = 0): boolean {
    const x = this.#coordinates.getX() + dx;
    const y = this.#coordinates.getY() + dy;
    return this.#markedCells.has(`${x},${y}`);
  }

  setDuelContext(opponent: Operator) {
    this.#opponent = opponent;
    this.#isDuelMode = true;
  }

  getOpponentPosition(): { x: number; y: number } | null {
    if (!this.#isDuelMode || !this.#opponent) return null;
    const opHistory = this.#opponent.getHistory();
    const step = Math.min(this.#stepCount, opHistory.length - 1);
    const pos = opHistory[step].position;
    return { x: pos.getX(), y: pos.getY() };
  }

  getDistanceTo(target: 'key' | 'exit'): number {
    const x = this.#coordinates.getX();
    const y = this.#coordinates.getY();

    for (let row = 0; row < this.#staticMap.length; row++) {
      for (let col = 0; col < this.#staticMap[0].length; col++) {
        const cell = this.#staticMap[row][col];
        const isTarget =
          target === 'key'
            ? cell.startsWith('key')
            : cell === 'exit';
        if (isTarget) {
          return Math.abs(x - col) + Math.abs(y - row);
        }
      }
    }
    return -1;
  }

  private _pickUpIfNeeded() {
    const x = this.#coordinates.getX();
    const y = this.#coordinates.getY();
    const under = this._originalContentAt(x, y);

    if ((under === 'key1' || under === 'key2') && !this.#hasKey) {
      this.#hasKey = true;
    }

    if (under === 'exit' && this.#hasKey) {
      this.#hasExited = true;
      this._clearCurrentCell();
    }
  }
}
