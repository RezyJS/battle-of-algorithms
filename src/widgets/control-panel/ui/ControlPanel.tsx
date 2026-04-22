'use client';

import type { StateSnapshot } from '@/src/shared/model';
import type { GameResult, GameMode } from '@/src/app/model/game-store';
import { SPEED_OPTIONS } from '@/src/app/model/game-store';
import type { ActiveBattle } from '@/src/shared/lib/api/internal';
import type { ArenaMapType } from '@/src/shared/lib/arena-config';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Clock,
} from 'lucide-react';
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
  onStepBackward: () => void;
  onStepForward: () => void;
  onSetStep: (step: number) => void;
  onSpeedChange: (index: number) => void;
}

export function ControlPanel({
  canManageArena,
  isRunning,
  currentStep,
  histories,
  speedIndex,
  result,
  activeBattle,
  onToggle,
  onReset,
  onStepBackward,
  onStepForward,
  onSetStep,
  onSpeedChange,
}: ControlPanelProps) {
  const maxSteps =
    histories.length > 0 ?
      Math.max(...histories.map((history) => history.length - 1))
    : 0;
  const progress = maxSteps > 0 ? (currentStep / maxSteps) * 100 : 0;

  const winnerLabel =
    result?.winner === 0 ?
      `Победил: 🔴 ${activeBattle?.left_player_name ?? 'Участник 1'}`
    : result?.winner === 1 ?
      `Победил: 🟢 ${activeBattle?.right_player_name ?? 'Участник 2'}`
    : 'Ничья';

  return (
    <>
      <div className='w-full space-y-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm'>
        {canManageArena ?
          <div className='flex gap-2'>
            <button
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
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
              className='rounded-lg bg-slate-100 px-3 py-2 text-slate-900 transition-colors hover:bg-slate-200'
              onClick={onReset}
              title='Сбросить'
            >
              <RotateCcw className='h-4 w-4' />
            </button>
          </div>
        : <div className='space-y-2'>
            <button
              className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
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

        <div className='space-y-1'>
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

        <div className='space-y-1.5'>
          <div className='flex justify-between text-xs text-slate-500'>
            <span>Шаг {currentStep}</span>
            <span>из {maxSteps}</span>
          </div>
          <input
            type='range'
            min={0}
            max={maxSteps}
            step={1}
            value={Math.min(currentStep, maxSteps)}
            onChange={(event) => onSetStep(Number(event.target.value))}
            className='w-full accent-indigo-600'
          />
          <div className='grid grid-cols-4 gap-1'>
            <button
              type='button'
              onClick={() => onSetStep(currentStep - 10)}
              className='flex items-center justify-center rounded bg-slate-100 py-1.5 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={currentStep === 0}
              title='Назад на 10 шагов'
            >
              <ChevronsLeft className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={onStepBackward}
              className='flex items-center justify-center rounded bg-slate-100 py-1.5 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={currentStep === 0}
              title='Назад на 1 шаг'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={onStepForward}
              className='flex items-center justify-center rounded bg-slate-100 py-1.5 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={currentStep >= maxSteps}
              title='Вперёд на 1 шаг'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={() => onSetStep(currentStep + 10)}
              className='flex items-center justify-center rounded bg-slate-100 py-1.5 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={currentStep >= maxSteps}
              title='Вперёд на 10 шагов'
            >
              <ChevronsRight className='h-4 w-4' />
            </button>
          </div>
          <div className='h-1.5 overflow-hidden rounded-full bg-slate-200'>
            <div
              className='h-full rounded-full bg-indigo-500 transition-all duration-200'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {result ?
        <div
          className={cn(
            'flex min-h-33 w-full flex-col items-center justify-center rounded-lg border px-3 py-2.5 text-center',
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
          <p className='text-sm font-medium text-slate-900'>{winnerLabel}</p>
          <p className='text-xs text-slate-600'>{result.reason}</p>
          <div className='mt-2 flex justify-center gap-4 text-xs'>
            <span className='text-slate-600'>🔴 {result.scores[0]} очков</span>
            <span className='text-slate-600'>🟢 {result.scores[1]} очков</span>
          </div>
        </div>
      : <div
          className={
            'flex min-h-33 w-full flex-col items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-center'
          }
        >
          <div className='flex items-center justify-center gap-2'>
            <Clock className={'h-4 w-4 text-indigo-600'} />
            <span className='text-sm font-bold text-indigo-600'>
              В процессе
            </span>
          </div>
        </div>
      }
    </>
  );
}
