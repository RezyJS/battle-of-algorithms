'use client';

import type {
  MouseEventHandler,
  ReactNode,
} from 'react';
import { cn } from '@/src/shared/lib/utils';

interface CellProps {
  content: string;
  className?: string;
  children?: ReactNode;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onMouseMove?: MouseEventHandler<HTMLDivElement>;
  title?: string;
}

export function getCellStyle(content: string): string {
  if (content === 'wall') return 'bg-gray-800 border-gray-700 shadow-inner';
  if (content === 'spawn1') return 'bg-red-950/60 border-red-700/60';
  if (content === 'spawn2') return 'bg-emerald-950/60 border-emerald-700/60';
  if (content === 'key_taken') return 'bg-gray-800/40 border-gray-700/30';
  if (content.startsWith('key')) return 'bg-amber-950/60 border-amber-700/50';
  if (content === 'exit') return 'bg-violet-950/60 border-violet-700/50';
  if (content.includes('🔴')) return 'bg-red-900/40 border-red-600/50';
  if (content.includes('🟢')) return 'bg-emerald-900/40 border-emerald-600/50';
  return 'bg-gray-900/50 border-gray-800/50';
}

export function getCellDisplay(content: string): string {
  if (content === 'spawn1') return '🔴';
  if (content === 'spawn2') return '🟢';
  if (content === 'key_taken') return '🔑';
  if (content.startsWith('key')) return '🔑';
  if (content === 'exit') return '🚪';
  if (content.includes('🔴') && content.includes('🟢')) return '💥';
  if (content.includes('🔴')) return '🔴';
  if (content.includes('🟢')) return '🟢';
  if (content === 'wall') return '';
  return '';
}

export function Cell({
  content,
  className,
  children,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  title,
}: CellProps) {
  return (
    <div
      className={cn(
        'relative w-12 h-12 m-px flex items-center justify-center text-xl font-bold rounded-sm border transition-colors duration-150 select-none',
        getCellStyle(content),
        content === 'key_taken' && 'opacity-30',
        className,
      )}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      title={title}
    >
      {getCellDisplay(content)}
      {children}
    </div>
  );
}
