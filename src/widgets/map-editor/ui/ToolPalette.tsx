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
    <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4 space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-white">Инструменты</h2>
        <p className="text-xs text-gray-500 mt-1">
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
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white',
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
                  : 'border-white/10 text-gray-500',
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
