'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GameMode } from '@/src/app/model/game-store';
import { ArenaMapType } from '@/src/shared/lib/arena-config';
import { ChevronDown, PenTool } from 'lucide-react';
import { useState } from 'react';

type TMetaBattleInfo = {
  gameMode: GameMode;
  mapType: ArenaMapType;
  mapWidth: number;
  mapHeight: number;
  canManageArena: boolean;
};

export default function MetaBattleInfo(props: TMetaBattleInfo) {
  const { gameMode, mapType, mapWidth, mapHeight, canManageArena } = props;

  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const mapTypeLabel =
    mapType === 'random' ? 'Случайная'
    : mapType === 'custom' ? 'Кастомная'
    : 'Статическая';

  return (
    <div className='w-full rounded-xl border border-slate-200 bg-white/80 shadow-sm'>
      <button
        type='button'
        onClick={() => setIsMetaOpen((value) => !value)}
        className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left'
      >
        <h3 className='text-sm font-semibold text-slate-800'>Параметры боя</h3>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-500 transition-transform',
            isMetaOpen && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'grid overflow-hidden transition-all duration-200 ease-out',
          isMetaOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className='min-h-0'>
          <div className='px-4 pb-4'>
          <div className='space-y-3'>
            <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
              <div className='text-[11px] uppercase tracking-[0.18em] text-slate-500'>
                Режим
              </div>
              <div className='mt-1 text-sm font-medium text-slate-950'>
                {gameMode === 'race' ? 'Гонка' : 'Дуэль'}
              </div>
            </div>

            <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
              <div className='text-[11px] uppercase tracking-[0.18em] text-slate-500'>
                Карта
              </div>
              <div className='mt-1 text-sm font-medium text-slate-950'>
                {mapTypeLabel}
              </div>
            </div>

            <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
              Размер поля: {mapWidth}×{mapHeight}
            </div>

            {canManageArena && (
              <div className='grid gap-2'>
                <Link
                  href='/moderation/arena'
                  className='flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500'
                >
                  Настроить арену
                </Link>
                <Link
                  href='/map-editor'
                  className='flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100'
                >
                  <PenTool className='h-3.5 w-3.5' />
                  Открыть конструктор карты
                </Link>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
