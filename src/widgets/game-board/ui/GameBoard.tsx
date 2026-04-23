'use client';

import type { FieldGrid } from '@/src/shared/model';
import { Cell } from './Cell';

interface GameBoardProps {
  field: FieldGrid;
}

export function GameBoard({ field }: GameBoardProps) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div className="inline-block min-w-full rounded-xl border border-slate-200 bg-white/80 p-3 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
        {field.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <Cell key={`${y}-${x}`} content={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
