'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { useGameStore, SPEED_OPTIONS } from '@/src/app/model/game-store';
import {
  algorithmTemplates,
  type AlgorithmTemplateName,
} from '@/src/features/script-editor';
import {
  buildCustomArenaMapConfig,
  buildRandomArenaMapConfig,
  buildStaticArenaMapConfig,
  type ArenaMapConfig,
} from '@/src/shared/lib/arena-config';
import { ExpandableCard } from '@/src/shared/ui/ExpandableCard';
import { ArenaLegend } from '@/src/widgets/arena-legend';
import { ControlPanel } from '@/src/widgets/control-panel';
import { EventLog } from '@/src/widgets/event-log';
import { GameBoard } from '@/src/widgets/game-board';
import { cn } from '@/src/shared/lib/utils';

const CUSTOM_MAP_DRAFT_KEY = 'boa-editor-custom-map-draft';

function playerStatus(
  hasHistory: boolean,
  hasKey: boolean,
  hasExited: boolean,
) {
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
    setStep,
    stepForward,
    stepBackward,
    setSpeedIndex,
    mapWidth,
    mapHeight,
    gameMode,
  } = useGameStore();
  const [opponentTemplate, setOpponentTemplate] =
    useState<AlgorithmTemplateName>('scanner');
  const [mapType, setMapType] = useState<'static' | 'random' | 'custom'>(
    'static',
  );
  const [randomWidth, setRandomWidth] = useState(10);
  const [randomHeight, setRandomHeight] = useState(8);
  const [customMapDraft] = useState<ArenaMapConfig | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawDraft = window.localStorage.getItem(CUSTOM_MAP_DRAFT_KEY);

    if (!rawDraft) {
      return null;
    }

    try {
      return JSON.parse(rawDraft) as ArenaMapConfig;
    } catch {
      window.localStorage.removeItem(CUSTOM_MAP_DRAFT_KEY);
      return null;
    }
  });
  const [randomVersion, setRandomVersion] = useState(0);

  useEffect(() => {
    if (mapType === 'custom' && customMapDraft) {
      applyArenaConfig(
        buildCustomArenaMapConfig({
          grid: customMapDraft.grid,
          spawn1: customMapDraft.spawn1,
          spawn2: customMapDraft.spawn2,
          gameMode: 'race',
        }),
      );
      return;
    }

    if (mapType === 'random') {
      applyArenaConfig(
        buildRandomArenaMapConfig(randomWidth, randomHeight, 'race'),
      );
      return;
    }

    applyArenaConfig(buildStaticArenaMapConfig());
  }, [
    applyArenaConfig,
    customMapDraft,
    mapType,
    randomHeight,
    randomVersion,
    randomWidth,
  ]);

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

  const leftState = histories[0]?.[currentStep];
  const rightState = histories[1]?.[currentStep];

  return (
    <ExpandableCard
      title='Тестовая арена'
      subtitle='Попробуйте как ваш код поведёт себя на соревновании.'
      actions={
        <div className='flex gap-3'>
          <label className='flex flex-col gap-1 text-sm text-slate-600'>
            <span className='text-xs'>Карта для теста</span>
            <select
              className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500'
              value={mapType}
              onChange={(event) =>
                setMapType(event.target.value as 'static' | 'random' | 'custom')
              }
              disabled={isRunning}
            >
              <option value='static'>Фиксированная</option>
              <option value='random'>Случайная</option>
              <option value='custom'>Из конструктора</option>
            </select>
          </label>
          <label className='flex flex-col gap-1 text-sm text-slate-600'>
            <span className='text-xs'>Тестовый соперник</span>
            <select
              className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500'
              value={opponentTemplate}
              onChange={(e) =>
                setOpponentTemplate(e.target.value as AlgorithmTemplateName)
              }
              disabled={isRunning}
            >
              {Object.entries(algorithmTemplates).map(([key, template]) => (
                <option
                  key={key}
                  value={key}
                >
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
      className='mt-6'
      contentClassName='space-y-4'
      defaultOpen
    >
      <div>
        <div className='flex gap-3 lg:items-start'>
          {mapType === 'random' && (
            <div className='flex w-full gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 justify-between'>
              <div className='flex gap-3'>
                <label className='flex flex-col gap-1 text-sm text-slate-600'>
                  <span>Ширина</span>
                  <input
                    type='number'
                    min={6}
                    max={20}
                    value={randomWidth}
                    disabled={isRunning}
                    onChange={(event) =>
                      setRandomWidth(Number(event.target.value) || 10)
                    }
                    className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500'
                  />
                </label>
                <label className='flex flex-col gap-1 text-sm text-slate-600'>
                  <span>Высота</span>
                  <input
                    type='number'
                    min={4}
                    max={14}
                    value={randomHeight}
                    disabled={isRunning}
                    onChange={(event) =>
                      setRandomHeight(Number(event.target.value) || 8)
                    }
                    className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500'
                  />
                </label>
              </div>
              <div className='flex items-center'>
                <button
                  type='button'
                  disabled={isRunning}
                  onClick={() => setRandomVersion((value) => value + 1)}
                  className='inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <RefreshCw className='h-4 w-4' />
                  Сгенерировать снова
                </button>
              </div>
            </div>
          )}

          {mapType === 'custom' && (
            <div className='flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600'>
              <div className='flex items-center justify-between gap-3'>
                <p>
                  {customMapDraft ?
                    `Черновик: ${customMapDraft.width}×${customMapDraft.height}`
                  : 'Черновик карты не сохранён'}
                </p>
                <Link
                  href='/editor/map'
                  className='rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100'
                >
                  Открыть конструктор
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-4'>
          <div className='flex justify-center'>
            <GameBoard field={field} />
          </div>
        </div>

        <div className='space-y-4'>
          <ControlPanel
            canManageArena={false}
            isRunning={isRunning}
            currentStep={currentStep}
            histories={histories}
            mapType={mapType}
            speedIndex={speedIndex}
            result={result}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            gameMode={gameMode}
            activeBattle={null}
            leftPlayerName='Ваш алгоритм'
            rightPlayerName={algorithmTemplates[opponentTemplate].name}
            startLabel='Запустить тест'
            pauseLabel='Пауза'
            showResetButton
            onToggle={togglePlayback}
            onReset={reset}
            onStepBackward={stepBackward}
            onStepForward={stepForward}
            onSetStep={setStep}
            onSpeedChange={setSpeedIndex}
          />

          {scriptError && (
            <div className='rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700'>
              {scriptError}
            </div>
          )}

          <EventLog messages={messages} />
          <ArenaLegend />

          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
              <div className='text-xs uppercase tracking-[0.18em] text-slate-500'>
                ⚙️ Вы
              </div>
              <div
                className={cn(
                  'mt-2 text-sm font-medium',
                  leftState?.hasExited ? 'text-emerald-600'
                  : leftState?.hasKey ? 'text-amber-600'
                  : 'text-slate-700',
                )}
              >
                {playerStatus(
                  Boolean(leftState),
                  Boolean(leftState?.hasKey),
                  Boolean(leftState?.hasExited),
                )}
              </div>
              <div className='mt-1 text-xs text-slate-500'>
                Шагов: {leftState ? currentStep : 0}
              </div>
            </div>

            <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
              <div className='text-xs uppercase tracking-[0.18em] text-slate-500'>
                🟢 Соперник
              </div>
              <div
                className={cn(
                  'mt-2 text-sm font-medium',
                  rightState?.hasExited ? 'text-emerald-600'
                  : rightState?.hasKey ? 'text-amber-600'
                  : 'text-slate-700',
                )}
              >
                {playerStatus(
                  Boolean(rightState),
                  Boolean(rightState?.hasKey),
                  Boolean(rightState?.hasExited),
                )}
              </div>
              <div className='mt-1 text-xs text-slate-500'>
                Шагов: {rightState ? currentStep : 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ExpandableCard>
  );
}
