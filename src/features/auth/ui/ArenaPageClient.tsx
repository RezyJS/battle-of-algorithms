'use client';

import { useEffect, useMemo, useRef } from 'react';

import { useGameStore, SPEED_OPTIONS } from '@/src/app/model/game-store';
import {
  loadPersistedPlaybackState,
  savePersistedPlaybackState,
} from '@/src/shared/lib/battle-playback-persist';
import { usePollingRefresh } from '@/src/shared/lib/usePollingRefresh';
import type { ActiveBattle } from '@/src/shared/lib/api/internal';
import {
  buildStaticArenaMapConfig,
  normalizeArenaMapConfig,
} from '@/src/shared/lib/arena-config';
import { ActiveBattlePage, NoBattlePage } from '@/src/widgets/arena-page';

export function ArenaPageClient({
  canManageArena,
  activeBattle,
}: {
  canManageArena: boolean;
  activeBattle: ActiveBattle | null;
}) {
  usePollingRefresh(5000);
  const appliedScriptsKeyRef = useRef<string | null>(null);
  const appliedConfigKeyRef = useRef<string | null>(null);
  const restoredPlaybackKeyRef = useRef<string | null>(null);

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
    restorePlaybackState,
    setScriptsPair,
    togglePlayback,
    reset,
    stepBackward,
    stepForward,
    setStep,
    setSpeedIndex,
  } = useGameStore();
  const scriptsKey = useMemo(
    () =>
      activeBattle?.left_code && activeBattle?.right_code ?
        `${activeBattle.id}:${activeBattle.left_code}:${activeBattle.right_code}`
      : null,
    [activeBattle?.id, activeBattle?.left_code, activeBattle?.right_code],
  );
  const configKey = useMemo(
    () =>
      JSON.stringify(
        normalizeArenaMapConfig(
          activeBattle?.map_config,
          buildStaticArenaMapConfig(),
        ),
      ),
    [activeBattle?.map_config],
  );
  const playbackKey = useMemo(
    () =>
      activeBattle ?
        `arena:${activeBattle.id}:${activeBattle.updated_at}`
      : null,
    [activeBattle],
  );

  useEffect(() => {
    if (
      activeBattle?.left_code &&
      activeBattle?.right_code &&
      appliedScriptsKeyRef.current !== scriptsKey
    ) {
      appliedScriptsKeyRef.current = scriptsKey;
      setScriptsPair(activeBattle.left_code, activeBattle.right_code);
    }
  }, [activeBattle?.left_code, activeBattle?.right_code, scriptsKey, setScriptsPair]);

  useEffect(() => {
    if (appliedConfigKeyRef.current === configKey) {
      return;
    }

    appliedConfigKeyRef.current = configKey;
    const nextConfig = JSON.parse(configKey);
    applyArenaConfig(nextConfig);
  }, [applyArenaConfig, configKey]);

  useEffect(() => {
    if (!isRunning || histories.length === 0 || histories[0]?.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      stepForward();
    }, SPEED_OPTIONS[speedIndex].ms);

    return () => clearInterval(timer);
  }, [isRunning, histories, stepForward, speedIndex]);

  useEffect(() => {
    if (
      !playbackKey ||
      histories.length === 0 ||
      restoredPlaybackKeyRef.current === playbackKey
    ) {
      return;
    }

    restoredPlaybackKeyRef.current = playbackKey;
    restorePlaybackState(loadPersistedPlaybackState(playbackKey));
  }, [histories.length, playbackKey, restorePlaybackState]);

  useEffect(() => {
    if (!playbackKey || histories.length === 0) {
      return;
    }

    savePersistedPlaybackState(playbackKey, {
      currentStep,
      messages,
      result,
    });
  }, [currentStep, histories.length, messages, playbackKey, result]);

  return (
    <div className='mx-auto h-full max-w-7xl px-4 py-4'>
      <div className='mb-4'>
        <h1 className='text-2xl font-bold'>Арена</h1>
        <p className='mt-1 text-sm text-slate-600'>
          Здесь вы можете следить за ходом публичных соревнований.
        </p>
      </div>

      {activeBattle ?
        <ActiveBattlePage
          activeBattle={activeBattle}
          field={field}
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
          onToggle={togglePlayback}
          onReset={reset}
          onStepBackward={stepBackward}
          onStepForward={stepForward}
          onSetStep={setStep}
          onSpeedChange={setSpeedIndex}
          scriptError={scriptError}
          messages={messages}
        />
      : <NoBattlePage />}
    </div>
  );
}
