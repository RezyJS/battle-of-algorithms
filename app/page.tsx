'use client';

import { useEffect } from 'react';
import { useGameStore, SPEED_OPTIONS } from '@/src/app/model/game-store';
import { GameBoard } from '@/src/widgets/game-board';
import { ControlPanel } from '@/src/widgets/control-panel';
import { EventLog } from '@/src/widgets/event-log';
import { ArenaLegend } from '@/src/widgets/arena-legend';

export default function ArenaPage() {
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
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isRunning || histories.length === 0 || histories[0]?.length <= 1)
      return;

    const timer = setInterval(() => {
      stepForward();
    }, SPEED_OPTIONS[speedIndex].ms);

    return () => clearInterval(timer);
  }, [isRunning, histories, stepForward, speedIndex]);

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Арена</h1>
        <p className='text-gray-400 text-sm mt-1'>
          Наблюдайте за соревнованием алгоритмов. Скрипты редактируются в{' '}
          <a
            href='/editor'
            className='text-indigo-400 hover:underline'
          >
            Редакторе
          </a>
          .
        </p>
      </div>

      <div className='flex gap-6'>
        {/* Game Board */}
        <div className='flex-1 flex items-start justify-center'>
          <GameBoard field={field} />
        </div>

        {/* Sidebar */}
        <div className='w-72 flex flex-col gap-4'>
          <ControlPanel
            isRunning={isRunning}
            currentStep={currentStep}
            histories={histories}
            useRandomMap={useRandomMap}
            speedIndex={speedIndex}
            result={result}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            gameMode={gameMode}
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
            <div className='bg-red-950/50 border border-red-800/50 text-red-300 p-3 rounded-xl text-sm'>
              {scriptError}
            </div>
          )}

          <EventLog messages={messages} />

          {/* Legend */}
          <ArenaLegend />
        </div>
      </div>
    </div>
  );
}
