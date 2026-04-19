'use client';

import type { BrushOption, BrushType } from '@/src/app/model/map-editor-store';
import { cn } from '@/src/shared/lib/utils';

interface ToolPaletteProps {
  tools: BrushOption[];
  activeTool: BrushType;
  onSelect: (tool: BrushType) => void;
}

export function ToolPalette({
  tools,
  activeTool,
  onSelect,
}: ToolPaletteProps) {
  return (
    <div className="bg-white/80 rounded-xl border border-slate-200 p-4 space-y-2 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">Инструменты</h2>
        <p className="text-xs text-slate-500 mt-1">
          Выбирайте кисть мышкой или клавишами `1-7`.
        </p>
      </div>

      <div className="space-y-1.5">
        {tools.map((tool) => (
          <button
            key={tool.type}
            type="button"
            onClick={() => onSelect(tool.type)}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-left transition-colors flex items-center justify-between gap-3',
              tool.type === activeTool
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950',
            )}
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="text-base shrink-0">{tool.icon}</span>
              <span className="text-sm font-medium truncate">{tool.label}</span>
            </span>
            <span
              className={cn(
                'text-[11px] font-mono px-1.5 py-0.5 rounded border',
                tool.type === activeTool
                  ? 'border-white/20 text-white/80'
                  : 'border-slate-200 text-slate-500',
              )}
            >
              {tool.hotkey}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
