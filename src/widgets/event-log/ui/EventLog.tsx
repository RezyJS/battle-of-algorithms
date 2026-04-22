'use client';

import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

interface EventLogProps {
  messages: string[];
}

export function EventLog({ messages }: EventLogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='w-full rounded-xl border border-slate-200 bg-white/80 shadow-sm'>
      <button
        type='button'
        onClick={() => setIsOpen((value) => !value)}
        className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left'
      >
        <div className='flex items-center gap-2'>
          <ScrollText className='h-4 w-4 text-slate-500' />
          <h3 className='text-sm font-semibold text-slate-800'>
            Журнал событий
          </h3>
        </div>
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
          {messages.length === 0 ?
            <p className='text-xs italic text-slate-500'>
              Нет событий. Нажмите «Старт».
            </p>
          : <div className='max-h-64 space-y-1 overflow-y-auto'>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className='rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700'
                >
                  {msg}
                </div>
              ))}
            </div>
          }
        </div>
        </div>
      </div>
    </div>
  );
}
