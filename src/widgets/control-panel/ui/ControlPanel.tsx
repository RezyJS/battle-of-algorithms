'use client';

import Link from 'next/link';
import type { StateSnapshot } from '@/src/shared/model';
import type { GameResult, GameMode } from '@/src/app/model/game-store';
import { SPEED_OPTIONS, MAP_SIZE_LIMITS } from '@/src/app/model/game-store';
import {
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Trophy,
  Minus,
  Plus,
  PenTool,
} from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

interface ControlPanelProps {
  isRunning: boolean;
  currentStep: number;
  histories: StateSnapshot[][];
  useRandomMap: boolean;
  speedIndex: number;
  result: GameResult;
  mapWidth: number;
  mapHeight: number;
  gameMode: GameMode;
  onToggle: () => void;
  onReset: () => void;
  isGenerating: boolean;
  onGenerateMap: () => void;
  onToggleRandomMap: (value: boolean) => void;
  onSpeedChange: (index: number) => void;
  onMapSizeChange: (width: number, height: number) => void;
  onGameModeChange: (mode: GameMode) => void;
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
  if (!history?.[step]) return 'text-gray-500';
  if (history[step].hasExited) return 'text-emerald-400';
  if (history[step].hasKey) return 'text-yellow-400';
  return 'text-gray-400';
}

export function ControlPanel({
  isRunning,
  currentStep,
  histories,
  useRandomMap,
  speedIndex,
  result,
  mapWidth,
  mapHeight,
  gameMode,
  isGenerating,
  onToggle,
  onReset,
  onGenerateMap,
  onToggleRandomMap,
  onSpeedChange,
  onMapSizeChange,
  onGameModeChange,
}: ControlPanelProps) {
  const maxSteps =
    histories.length > 0
      ? Math.max(...histories.map((h) => h.length - 1))
      : 0;
  const progress = maxSteps > 0 ? (currentStep / maxSteps) * 100 : 0;

  return (
    <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4 space-y-4">
      {/* Game mode selector */}
      <div className="space-y-1.5">
        <div className="text-xs text-gray-400">Режим</div>
        <div className="flex gap-1">
          {([['race', 'Гонка'], ['duel', 'Дуэль']] as const).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => onGameModeChange(mode)}
              className={cn(
                'flex-1 py-1.5 rounded text-xs font-medium transition-colors',
                mode === gameMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {gameMode === 'race'
            ? 'Универсальные алгоритмы, карта неизвестна заранее'
            : 'Карта фиксирована, доступен getOpponentPosition()'}
        </p>

        {gameMode === 'duel' && (
          <Link
            href="/map-editor"
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
          >
            <PenTool className="w-3.5 h-3.5" />
            Редактировать карту
          </Link>
        )}
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={cn(
            'rounded-lg p-3 border text-center',
            result.winner !== null
              ? 'bg-emerald-950/40 border-emerald-800/50'
              : 'bg-amber-950/40 border-amber-800/50',
          )}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy
              className={cn(
                'w-4 h-4',
                result.winner !== null
                  ? 'text-emerald-400'
                  : 'text-amber-400',
              )}
            />
            <span className="text-sm font-bold text-white">
              {result.winner !== null ? 'Победа!' : 'Ничья'}
            </span>
          </div>
          <p className="text-xs text-gray-300">{result.reason}</p>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="text-gray-400">
              🔴 {result.scores[0]} очков
            </span>
            <span className="text-gray-400">
              🟢 {result.scores[1]} очков
            </span>
          </div>
        </div>
      )}

      {/* Playback */}
      <div className="flex gap-2">
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          onClick={onToggle}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" /> Пауза
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Старт
            </>
          )}
        </button>
        <button
          className="px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          onClick={onReset}
          title="Сбросить"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Speed selector */}
      <div className="space-y-1.5">
        <div className="text-xs text-gray-400">Скорость</div>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((opt, idx) => (
            <button
              key={opt.label}
              onClick={() => onSpeedChange(idx)}
              className={cn(
                'flex-1 py-1 rounded text-xs font-medium transition-colors',
                idx === speedIndex
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Шаг {currentStep}</span>
          <span>из {maxSteps}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Player status */}
      <div className="space-y-2">
        <div className="bg-gray-800/50 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">🔴</span>
          <div className="min-w-0 flex-1">
            <div className="text-gray-500 text-xs">Игрок 1</div>
            <div
              className={`text-xs font-medium truncate ${playerStatusColor(histories[0], currentStep)}`}
            >
              {playerStatus(histories[0], currentStep)}
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">🟢</span>
          <div className="min-w-0 flex-1">
            <div className="text-gray-500 text-xs">Игрок 2</div>
            <div
              className={`text-xs font-medium truncate ${playerStatusColor(histories[1], currentStep)}`}
            >
              {playerStatus(histories[1], currentStep)}
            </div>
          </div>
        </div>
      </div>

      {/* Map controls */}
      <div className="border-t border-gray-800 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Случайная карта</span>
          <button
            onClick={() => onToggleRandomMap(!useRandomMap)}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              useRandomMap ? 'bg-indigo-600' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                useRandomMap ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {useRandomMap && (
          <>
            {/* Map size controls */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Ширина</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onMapSizeChange(mapWidth - 2, mapHeight)}
                    disabled={mapWidth <= MAP_SIZE_LIMITS.minWidth}
                    className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="flex-1 text-center text-xs font-mono text-white">
                    {mapWidth}
                  </span>
                  <button
                    onClick={() => onMapSizeChange(mapWidth + 2, mapHeight)}
                    disabled={mapWidth >= MAP_SIZE_LIMITS.maxWidth}
                    className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Высота</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onMapSizeChange(mapWidth, mapHeight - 2)}
                    disabled={mapHeight <= MAP_SIZE_LIMITS.minHeight}
                    className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="flex-1 text-center text-xs font-mono text-white">
                    {mapHeight}
                  </span>
                  <button
                    onClick={() => onMapSizeChange(mapWidth, mapHeight + 2)}
                    disabled={mapHeight >= MAP_SIZE_LIMITS.maxHeight}
                    className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onGenerateMap}
              disabled={isGenerating}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isGenerating
                  ? 'bg-indigo-600/30 text-indigo-300 cursor-wait'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300',
              )}
            >
              <Shuffle className={cn('w-3.5 h-3.5', isGenerating && 'animate-spin')} />
              {isGenerating ? 'Генерация...' : 'Новая карта'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
