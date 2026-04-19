'use client';

import Link from 'next/link';
import type { StateSnapshot } from '@/src/shared/model';
import type { GameResult, GameMode } from '@/src/app/model/game-store';
import { SPEED_OPTIONS } from '@/src/app/model/game-store';
import type { ActiveBattle } from '@/src/shared/lib/api/internal';
import type { ArenaMapType } from '@/src/shared/lib/arena-config';
import { Play, Pause, RotateCcw, Trophy, PenTool } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

interface ControlPanelProps {
  canManageArena: boolean;
  isRunning: boolean;
  currentStep: number;
  histories: StateSnapshot[][];
  mapType: ArenaMapType;
  speedIndex: number;
  result: GameResult;
  mapWidth: number;
  mapHeight: number;
  gameMode: GameMode;
  activeBattle: ActiveBattle | null;
  onToggle: () => void;
  onReset: () => void;
  onSpeedChange: (index: number) => void;
}

function playerStatus(
  history: StateSnapshot[] | undefined,
  step: number,
): string {
  if (!history?.[step]) return 'Ожидание...';
  if (history[step].hasExited) return 'Выбрался!';
  if (history[step].hasKey) return 'Есть ключ';
  return 'Поиск...';
}

function playerStatusColor(
  history: StateSnapshot[] | undefined,
  step: number,
): string {
  if (!history?.[step]) return 'text-slate-400';
  if (history[step].hasExited) return 'text-emerald-600';
  if (history[step].hasKey) return 'text-amber-600';
  return 'text-slate-600';
}

export function ControlPanel({
  canManageArena,
  isRunning,
  currentStep,
  histories,
  mapType,
  speedIndex,
  result,
  mapWidth,
  mapHeight,
  gameMode,
  activeBattle,
  onToggle,
  onReset,
  onSpeedChange,
}: ControlPanelProps) {
  const maxSteps =
    histories.length > 0 ?
      Math.max(...histories.map((history) => history.length - 1))
    : 0;
  const progress = maxSteps > 0 ? (currentStep / maxSteps) * 100 : 0;
  const mapTypeLabel =
    mapType === 'random' ? 'Случайная'
    : mapType === 'custom' ? 'Кастомная'
    : 'Статическая';

  return (
    <div className='space-y-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm'>
      <div className='space-y-3'>
        <div className='grid gap-2 sm:grid-cols-2'>
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

      {result && (
        <div
          className={cn(
            'rounded-lg border p-3 text-center',
            result.winner !== null ?
              'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50',
          )}
        >
          <div className='mb-1 flex items-center justify-center gap-2'>
            <Trophy
              className={cn(
                'h-4 w-4',
                result.winner !== null ? 'text-emerald-600' : 'text-amber-600',
              )}
            />
            <span className='text-sm font-bold text-slate-950'>
              {result.winner !== null ? 'Победа!' : 'Ничья'}
            </span>
          </div>
          <p className='text-xs text-slate-600'>{result.reason}</p>
          <div className='mt-2 flex justify-center gap-4 text-xs'>
            <span className='text-slate-600'>🔴 {result.scores[0]} очков</span>
            <span className='text-slate-600'>🟢 {result.scores[1]} очков</span>
          </div>
        </div>
      )}

      {canManageArena ?
        <div className='flex gap-2'>
          <button
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              isRunning ?
                'bg-red-600 text-white hover:bg-red-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            onClick={onToggle}
          >
            <span className='flex items-center justify-center gap-2'>
              {isRunning ?
                <>
                  <Pause className='h-4 w-4' /> Пауза
                </>
              : <>
                  <Play className='h-4 w-4' /> Старт
                </>
              }
            </span>
          </button>
          <button
            className='rounded-lg bg-slate-100 px-3 py-2.5 text-slate-900 transition-colors hover:bg-slate-200'
            onClick={onReset}
            title='Сбросить'
          >
            <RotateCcw className='h-4 w-4' />
          </button>
        </div>
      : <div className='space-y-2'>
          <button
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              isRunning ?
                'bg-red-600 text-white hover:bg-red-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            onClick={onToggle}
          >
            <span className='flex items-center justify-center gap-2'>
              {isRunning ?
                <>
                  <Pause className='h-4 w-4' /> Пауза просмотра
                </>
              : <>
                  <Play className='h-4 w-4' /> Начать просмотр
                </>
              }
            </span>
          </button>
        </div>
      }

      <div className='space-y-1.5'>
        <div className='text-xs text-slate-500'>Скорость</div>
        <div className='flex gap-1'>
          {SPEED_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              onClick={() => onSpeedChange(index)}
              className={cn(
                'flex-1 rounded py-1 text-xs font-medium transition-colors',
                index === speedIndex ?
                  'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex justify-between text-xs text-slate-500'>
          <span>Шаг {currentStep}</span>
          <span>из {maxSteps}</span>
        </div>
        <div className='h-1.5 overflow-hidden rounded-full bg-slate-200'>
          <div
            className='h-full rounded-full bg-indigo-500 transition-all duration-200'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5'>
          <span className='shrink-0 text-base'>🔴</span>
          <div className='min-w-0 flex-1'>
            <div className='text-xs text-slate-500'>
              {activeBattle?.left_player_name ?? 'Игрок 1'}
            </div>
            {activeBattle?.left_submission_version && (
              <div className='text-[10px] text-slate-400'>
                v{activeBattle.left_submission_version}
              </div>
            )}
            <div
              className={`truncate text-xs font-medium ${playerStatusColor(histories[0], currentStep)}`}
            >
              {playerStatus(histories[0], currentStep)}
            </div>
          </div>
        </div>
        <div className='flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5'>
          <span className='shrink-0 text-base'>🟢</span>
          <div className='min-w-0 flex-1'>
            <div className='text-xs text-slate-500'>
              {activeBattle?.right_player_name ?? 'Игрок 2'}
            </div>
            {activeBattle?.right_submission_version && (
              <div className='text-[10px] text-slate-400'>
                v{activeBattle.right_submission_version}
              </div>
            )}
            <div
              className={`truncate text-xs font-medium ${playerStatusColor(histories[1], currentStep)}`}
            >
              {playerStatus(histories[1], currentStep)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
