export enum CellType {
  Ground = 'GROUND',
  Wall = 'WALL',
  ControlPointUnclaimed = 'CONTROL_POINT_UNCLAIMED',
  ControlPointFirstPlayer = 'CONTROL_POINT_FIRST_PLAYER',
  ControlPointSecondPlayer = 'CONTROL_POINT_SECOND_PLAYER',
}

export enum Players {
  First = 'Player 1',
  Second = 'Player 2',
}

export type Cell = {
  type: CellType;
  claimedBy?: Players;
};

export type TField = Array<Array<Cell>>;
export type PlayerCoords = {
  x: number;
  y: number;
};
