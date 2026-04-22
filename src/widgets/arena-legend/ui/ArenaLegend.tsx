'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

export default function ArenaLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='w-full rounded-xl border border-slate-200 bg-white/80 shadow-sm'>
      <button
        type='button'
        onClick={() => setIsOpen((value) => !value)}
        className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left'
      >
        <h3 className='text-sm font-semibold text-slate-800'>Обозначения</h3>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-500 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'grid overflow-hidden transition-all duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className='min-h-0'>
          <div className='px-4 pb-4'>
          <div className='grid grid-cols-2 gap-2 text-xs text-slate-600'>
            <div className='flex items-center gap-1.5'>
              <span>🔴</span> Игрок 1
            </div>
            <div className='flex items-center gap-1.5'>
              <span>🟢</span> Игрок 2
            </div>
            <div className='flex items-center gap-1.5'>
              <span>🔑</span> Ключ
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='opacity-30'>🔑</span> Подобран
            </div>
            <div className='flex items-center gap-1.5'>
              <span>🚪</span> Выход
            </div>
            <div className='flex items-center gap-1.5'>
              <span>💥</span> Столкновение
            </div>
            <div className='flex items-center gap-1.5'>
              <div className='h-3 w-3 rounded-sm border border-slate-400 bg-slate-300' />
              Стена
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
