'use client';

import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Swords } from 'lucide-react';

import { useGameStore, SPEED_OPTIONS } from '@/src/app/model/game-store';
import { algorithmTemplates, type AlgorithmTemplateName } from '@/src/features/script-editor';
import { buildStaticArenaMapConfig } from '@/src/shared/lib/arena-config';
import { ArenaLegend } from '@/src/widgets/arena-legend';
import { EventLog } from '@/src/widgets/event-log';
import { GameBoard } from '@/src/widgets/game-board';
import { cn } from '@/src/shared/lib/utils';

function playerStatus(hasHistory: boolean, hasKey: boolean, hasExited: boolean) {
  if (!hasHistory) return 'Ожидание запуска';
  if (hasExited) return 'Выбрался';
  if (hasKey) return 'Ключ найден';
  return 'Ищет маршрут';
}

export function EditorArenaPreview() {
  const {
    currentStep,
    isRunning,
    messages,
    histories,
    scriptError,
    field,
    speedIndex,
    result,
    setScript,
    applyArenaConfig,
    togglePlayback,
    reset,
    stepForward,
    setSpeedIndex,
  } = useGameStore();
  const [opponentTemplate, setOpponentTemplate] =
    useState<AlgorithmTemplateName>('wallFollower');

  useEffect(() => {
    applyArenaConfig(buildStaticArenaMapConfig());
  }, [applyArenaConfig]);

  useEffect(() => {
    setScript(1, algorithmTemplates[opponentTemplate].code);
  }, [opponentTemplate, setScript]);

  useEffect(() => {
    if (!isRunning || histories.length === 0 || histories[0]?.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      stepForward();
    }, SPEED_OPTIONS[speedIndex].ms);

    return () => clearInterval(timer);
  }, [histories, isRunning, speedIndex, stepForward]);

  const maxSteps =
    histories.length > 0 ?
      Math.max(...histories.map((history) => history.length - 1))
    : 0;
  const progress = maxSteps > 0 ? (currentStep / maxSteps) * 100 : 0;
  const leftState = histories[0]?.[currentStep];
  const rightState = histories[1]?.[currentStep];

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-indigo-600">
            <Swords className="h-3.5 w-3.5" />
            Тестовая арена
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            Проверьте алгоритм до отправки
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Текущий код запускается против тестового соперника на статической карте.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span>Тестовый соперник</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            value={opponentTemplate}
            onChange={(e) =>
              setOpponentTemplate(e.target.value as AlgorithmTemplateName)
            }
            disabled={isRunning}
          >
            {Object.entries(algorithmTemplates).map(([key, template]) => (
              <option key={key} value={key}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex justify-center">
            <GameBoard field={field} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                ⚙️ Ваш алгоритм
              </div>
              <div
                className={cn(
                  'mt-2 text-sm font-medium',
                  leftState?.hasExited ? 'text-emerald-600'
                  : leftState?.hasKey ? 'text-amber-600'
                  : 'text-slate-700',
                )}
              >
                {playerStatus(Boolean(leftState), Boolean(leftState?.hasKey), Boolean(leftState?.hasExited))}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Шагов: {leftState ? currentStep : 0}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                🟢 {algorithmTemplates[opponentTemplate].name}
              </div>
              <div
                className={cn(
                  'mt-2 text-sm font-medium',
                  rightState?.hasExited ? 'text-emerald-600'
                  : rightState?.hasKey ? 'text-amber-600'
                  : 'text-slate-700',
                )}
              >
                {playerStatus(Boolean(rightState), Boolean(rightState?.hasKey), Boolean(rightState?.hasExited))}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Шагов: {rightState ? currentStep : 0}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-2">
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors',
                  isRunning ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500',
                )}
                onClick={togglePlayback}
              >
                <span className="flex items-center justify-center gap-2">
                  {isRunning ?
                    <>
                      <Pause className="h-4 w-4" /> Пауза
                    </>
                  : <>
                      <Play className="h-4 w-4" /> Запустить тест
                    </>
                  }
                </span>
              </button>

              <button
                type="button"
                className="rounded-lg bg-white px-3 py-2.5 text-slate-800 transition-colors hover:bg-slate-100 border border-slate-200"
                onClick={reset}
                title="Сбросить"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Шаг {currentStep}</span>
                <span>из {maxSteps}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="text-xs text-slate-500">Скорость</div>
              <div className="flex gap-1">
                {SPEED_OPTIONS.map((option, index) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSpeedIndex(index)}
                    className={cn(
                      'flex-1 rounded py-1 text-xs font-medium transition-colors',
                      index === speedIndex ?
                        'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {result && (
            <div
              className={cn(
                'rounded-xl border p-4 text-sm',
                result.winner !== null ?
                  result.winner === 0 ?
                    'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-slate-50 text-slate-800',
              )}
            >
              <div className="font-semibold">
                {result.winner === 0 ? 'Ваш алгоритм победил'
                : result.winner === 1 ? 'Тестовый соперник победил'
                : 'Ничья'}
              </div>
              <p className="mt-1 text-xs opacity-80">{result.reason}</p>
              <p className="mt-2 text-xs opacity-80">
                Счёт: ⚙️ {result.scores[0]} · 🟢 {result.scores[1]}
              </p>
            </div>
          )}

          {scriptError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {scriptError}
            </div>
          )}

          <EventLog messages={messages} />
          <ArenaLegend />
        </div>
      </div>
    </section>
  );
}
