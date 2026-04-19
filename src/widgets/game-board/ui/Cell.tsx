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
  if (content === 'wall') return 'bg-slate-300 border-slate-400 shadow-inner';
  if (content === 'spawn1') return 'bg-rose-100 border-rose-300';
  if (content === 'spawn2') return 'bg-emerald-100 border-emerald-300';
  if (content === 'key_taken') return 'bg-amber-50 border-amber-200';
  if (content.startsWith('key')) return 'bg-amber-100 border-amber-300';
  if (content === 'exit') return 'bg-violet-100 border-violet-300';
  if (content.includes('🔴') && content.includes('🟢')) return 'bg-orange-100 border-orange-300';
  if (content.includes('🔴')) return 'bg-rose-100 border-rose-300';
  if (content.includes('🟢')) return 'bg-emerald-100 border-emerald-300';
  return 'bg-white border-slate-200';
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
