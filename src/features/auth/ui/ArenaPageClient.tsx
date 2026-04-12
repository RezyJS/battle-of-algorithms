'use client';

import { useEffect } from 'react';

import { useGameStore, SPEED_OPTIONS } from '@/src/app/model/game-store';
import { ArenaLegend } from '@/src/widgets/arena-legend';
import { ControlPanel } from '@/src/widgets/control-panel';
import { EventLog } from '@/src/widgets/event-log';
import { GameBoard } from '@/src/widgets/game-board';
import type { ActiveBattle } from '@/src/shared/lib/api/internal';

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
    useRandomMap,
    speedIndex,
    result,
    mapWidth,
    mapHeight,
    gameMode,
    setGameMode,
    setScriptsPair,
    initialize,
    togglePlayback,
    reset,
    stepForward,
    generateNewMapAnimated,
    isGenerating,
    setUseRandomMap,
    setSpeedIndex,
    setMapSize,
  } = useGameStore();

  useEffect(() => {
    if (activeBattle?.left_code && activeBattle?.right_code) {
      setScriptsPair(activeBattle.left_code, activeBattle.right_code);
    }
  }, [activeBattle?.left_code, activeBattle?.right_code, setScriptsPair]);

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
        <p className="text-gray-400 text-sm mt-1">
          Наблюдайте за соревнованием алгоритмов. Скрипты редактируются в{' '}
          <a href="/editor" className="text-indigo-400 hover:underline">
            Редакторе
          </a>
          .
        </p>
      </div>

      {activeBattle ? (
        <div className="mb-6 rounded-2xl border border-white/10 bg-gray-900/50 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">
            Сейчас бой
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {activeBattle.left_player_name} vs {activeBattle.right_player_name}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Версии: v{activeBattle.left_submission_version} vs v{activeBattle.right_submission_version}
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-white/10 bg-gray-900/30 px-5 py-4">
          <p className="text-sm text-gray-400">Сейчас бой не выбран.</p>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 flex items-start justify-center">
          <GameBoard field={field} />
        </div>

        <div className="w-72 flex flex-col gap-4">
          <ControlPanel
            canManageArena={canManageArena}
            isRunning={isRunning}
            currentStep={currentStep}
            histories={histories}
            useRandomMap={useRandomMap}
            speedIndex={speedIndex}
            result={result}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            gameMode={gameMode}
            activeBattle={activeBattle}
            isGenerating={isGenerating}
            onToggle={togglePlayback}
            onReset={reset}
            onGenerateMap={generateNewMapAnimated}
            onToggleRandomMap={setUseRandomMap}
            onSpeedChange={setSpeedIndex}
            onMapSizeChange={setMapSize}
            onGameModeChange={setGameMode}
          />

          {scriptError && (
            <div className="bg-red-950/50 border border-red-800/50 text-red-300 p-3 rounded-xl text-sm">
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
