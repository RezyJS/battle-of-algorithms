'use client';

import { useEffect } from 'react';

import { useGameStore, SPEED_OPTIONS } from '@/src/app/model/game-store';
import { ArenaLegend } from '@/src/widgets/arena-legend';
import { ControlPanel } from '@/src/widgets/control-panel';
import { EventLog } from '@/src/widgets/event-log';
import { GameBoard } from '@/src/widgets/game-board';
import type { ActiveBattle } from '@/src/shared/lib/api/internal';
import {
  buildStaticArenaMapConfig,
  normalizeArenaMapConfig,
} from '@/src/shared/lib/arena-config';

export function ArenaPageClient({
  canManageArena,
  activeBattle,
}: {
  canManageArena: boolean;
  activeBattle: ActiveBattle | null;
}) {
  const {
    currentStep,
    isRunning,
    messages,
    histories,
    scriptError,
    field,
    mapType,
    speedIndex,
    result,
    mapWidth,
    mapHeight,
    gameMode,
    applyArenaConfig,
    setScriptsPair,
    initialize,
    togglePlayback,
    reset,
    stepForward,
    setSpeedIndex,
  } = useGameStore();

  useEffect(() => {
    if (activeBattle?.left_code && activeBattle?.right_code) {
      setScriptsPair(activeBattle.left_code, activeBattle.right_code);
    }
  }, [activeBattle?.left_code, activeBattle?.right_code, setScriptsPair]);

  useEffect(() => {
    const nextConfig = normalizeArenaMapConfig(
      activeBattle?.map_config,
      buildStaticArenaMapConfig(),
    );

    applyArenaConfig(nextConfig);
  }, [activeBattle?.map_config, applyArenaConfig]);

  useEffect(() => {
    initialize();
  }, [initialize, activeBattle?.left_code, activeBattle?.right_code]);

  useEffect(() => {
    if (!isRunning || histories.length === 0 || histories[0]?.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      stepForward();
    }, SPEED_OPTIONS[speedIndex].ms);

    return () => clearInterval(timer);
  }, [isRunning, histories, stepForward, speedIndex]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Арена</h1>
        <p className="text-slate-600 text-sm mt-1">
          Наблюдайте за соревнованием алгоритмов. Скрипты редактируются в{' '}
          <a href="/editor" className="text-indigo-600 hover:underline">
            Редакторе
          </a>
          .
        </p>
      </div>

      {activeBattle ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-600">
            Сейчас бой
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {activeBattle.left_player_name} vs {activeBattle.right_player_name}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Версии: v{activeBattle.left_submission_version} vs v{activeBattle.right_submission_version}
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-600">Сейчас бой не выбран.</p>
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex-1 flex items-start justify-center">
          <GameBoard field={field} />
        </div>

        <div className="xl:w-72 flex flex-col gap-4">
          <ControlPanel
            canManageArena={canManageArena}
            isRunning={isRunning}
            currentStep={currentStep}
            histories={histories}
            mapType={mapType}
            speedIndex={speedIndex}
            result={result}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            gameMode={gameMode}
            activeBattle={activeBattle}
            onToggle={togglePlayback}
            onReset={reset}
            onSpeedChange={setSpeedIndex}
          />

          {scriptError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-sm shadow-sm">
              {scriptError}
            </div>
          )}

          <EventLog messages={messages} />
          <ArenaLegend />
        </div>
      </div>
    </div>
  );
}
