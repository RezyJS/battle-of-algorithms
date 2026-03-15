'use client';

import type { FieldGrid } from '@/src/shared/model';
import { Cell } from './Cell';

interface GameBoardProps {
  field: FieldGrid;
}

export function GameBoard({ field }: GameBoardProps) {
  return (
    <div className="bg-gray-900/50 p-3 rounded-xl border border-white/5 shadow-2xl">
      {field.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
            <Cell key={`${y}-${x}`} content={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}
