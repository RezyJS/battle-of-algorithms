'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { BrushType } from '@/src/app/model/map-editor-store';
import type { FieldGrid } from '@/src/shared/model';
import { cn } from '@/src/shared/lib/utils';
import {
  Cell,
  getCellDisplay,
  getCellStyle,
} from '@/src/widgets/game-board/ui/Cell';

interface MapEditorGridProps {
  grid: FieldGrid;
  activeTool: BrushType;
  onPaint: (x: number, y: number) => void;
}

function isPerimeterCell(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return x === 0 || y === 0 || x === width - 1 || y === height - 1;
}

function getPreviewContent(tool: BrushType): string {
  return tool === 'empty' ? 'empty' : tool;
}

function getCellTitle(content: string): string {
  switch (content) {
    case 'wall':
      return 'Стена';
    case 'key1':
      return 'Ключ 1';
    case 'key2':
      return 'Ключ 2';
    case 'exit':
      return 'Выход';
    case 'spawn1':
      return 'Спавн 1';
    case 'spawn2':
      return 'Спавн 2';
    default:
      return 'Пустая клетка';
  }
}

export function MapEditorGrid({
  grid,
  activeTool,
  onPaint,
}: MapEditorGridProps) {
  const [isPainting, setIsPainting] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const lastPaintedCellRef = useRef<string | null>(null);
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const previewContent = getPreviewContent(activeTool);

  useEffect(() => {
    const stopPainting = () => {
      setIsPainting(false);
      lastPaintedCellRef.current = null;
    };

    document.addEventListener('mouseup', stopPainting);
    window.addEventListener('blur', stopPainting);

    return () => {
      document.removeEventListener('mouseup', stopPainting);
      window.removeEventListener('blur', stopPainting);
    };
  }, []);

  const paint = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (lastPaintedCellRef.current === key) {
      return;
    }

    onPaint(x, y);
    lastPaintedCellRef.current = key;
  };

  const handleMouseDown = (
    event: MouseEvent<HTMLDivElement>,
    x: number,
    y: number,
  ) => {
    event.preventDefault();
    if (isPerimeterCell(x, y, width, height)) {
      return;
    }
    setIsPainting(true);
    paint(x, y);
  };

  const handleMouseMove = (x: number, y: number) => {
    if (!isPainting) {
      return;
    }

    paint(x, y);
  };

  return (
    <div className="bg-white/80 p-3 rounded-xl border border-slate-200 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] overflow-auto">
      {grid.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => {
            const key = `${x},${y}`;
            const isHovered = hoveredCell === key;
            const locked = isPerimeterCell(x, y, width, height);

            return (
              <Cell
                key={key}
                content={cell}
                className={cn(
                  'cursor-crosshair',
                  locked && 'cursor-not-allowed',
                  isPainting && !locked && 'ring-1 ring-indigo-400/30',
                )}
                title={locked ? 'Периметр карты всегда остаётся стеной' : getCellTitle(cell)}
                onMouseDown={(event) => handleMouseDown(event, x, y)}
                onMouseEnter={() => {
                  setHoveredCell(key);
                  handleMouseMove(x, y);
                }}
                onMouseMove={() => handleMouseMove(x, y)}
                onMouseLeave={() => {
                  setHoveredCell((current) => (current === key ? null : current));
                }}
              >
                {isHovered && !locked && (
                  <div
                    className={cn(
                      'absolute inset-0 rounded-sm border pointer-events-none flex items-center justify-center text-xl font-bold opacity-70',
                      getCellStyle(previewContent),
                    )}
                  >
                    {getCellDisplay(previewContent)}
                  </div>
                )}
              </Cell>
            );
          })}
        </div>
      ))}
    </div>
  );
}
