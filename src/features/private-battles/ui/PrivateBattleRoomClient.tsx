'use client';

import { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, RefreshCw, Save, Send, Swords } from 'lucide-react';

import {
  confirmPrivateBattleCodeAction,
  markPrivateBattleReadyAction,
  rerollPrivateBattleMapAction,
  savePrivateBattleCodeAction,
  savePrivateBattleResultAction,
} from '@/app/private-battles/[battleId]/actions';
import { useGameStore, SPEED_OPTIONS } from '@/src/app/model/game-store';
import { ScriptEditor } from '@/src/features/script-editor';
import type { GameResult } from '@/src/app/model/game-store';
import type { ActiveBattle, PrivateBattle } from '@/src/shared/lib/api/internal';
import {
  buildStaticArenaMapConfig,
  normalizeArenaMapConfig,
} from '@/src/shared/lib/arena-config';
import { ArenaLegend } from '@/src/widgets/arena-legend';
import { ControlPanel } from '@/src/widgets/control-panel';
import { EventLog } from '@/src/widgets/event-log';
import { GameBoard } from '@/src/widgets/game-board';

function getSlotReadinessLabel(isReady: boolean) {
  return isReady ? 'Готов' : 'Ждёт подтверждения';
}

function getCodeConfirmationLabel(isConfirmed: boolean) {
  return isConfirmed ? 'Код подтверждён' : 'Код не подтверждён';
}

export function PrivateBattleRoomClient({
  battle: initialBattle,
}: {
  battle: PrivateBattle;
}) {
  const [battle, setBattle] = useState(initialBattle);
  const [code, setCode] = useState(initialBattle.current_user_code);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);
  const [isRerollingMap, setIsRerollingMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingResult, setIsSavingResult] = useState(false);

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
    setBattle(initialBattle);
    setCode(initialBattle.current_user_code);
  }, [initialBattle]);

  useEffect(() => {
    if (!battle.can_view_battle || !battle.left_code || !battle.right_code) {
      return;
    }

    setScriptsPair(battle.left_code, battle.right_code);
  }, [battle.can_view_battle, battle.left_code, battle.right_code, setScriptsPair]);

  useEffect(() => {
    if (!battle.can_view_battle) {
      return;
    }

    const nextConfig = normalizeArenaMapConfig(
      battle.map_config,
      buildStaticArenaMapConfig(),
    );

    applyArenaConfig(nextConfig);
  }, [battle.can_view_battle, battle.map_config, applyArenaConfig]);

  useEffect(() => {
    if (!battle.can_view_battle) {
      return;
    }

    initialize();
  }, [battle.can_view_battle, initialize, battle.left_code, battle.right_code]);

  useEffect(() => {
    if (!battle.can_view_battle) {
      return;
    }

    if (!isRunning || histories.length === 0 || histories[0]?.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      stepForward();
    }, SPEED_OPTIONS[speedIndex].ms);

    return () => clearInterval(timer);
  }, [battle.can_view_battle, histories, isRunning, speedIndex, stepForward]);

  useEffect(() => {
    if (!battle.can_view_battle || !result || battle.has_result || isSavingResult) {
      return;
    }

    setIsSavingResult(true);

    startTransition(async () => {
      try {
        const nextBattle = await savePrivateBattleResultAction(battle.id, result);
        setBattle(nextBattle);
      } catch {
        setErrorMessage('Не удалось сохранить результат боя');
      } finally {
        setIsSavingResult(false);
      }
    });
  }, [battle.can_view_battle, battle.has_result, battle.id, isSavingResult, result]);

  const isLeftUser = battle.current_user_slot === 'left';
  const currentUserName =
    isLeftUser ? battle.left_player_name : battle.right_player_name;
  const currentUserUsername =
    isLeftUser ? battle.left_player_username : battle.right_player_username;
  const opponentName =
    isLeftUser ? battle.right_player_name : battle.left_player_name;
  const opponentUsername =
    isLeftUser ? battle.right_player_username : battle.left_player_username;
  const currentUserReady = isLeftUser ? battle.left_ready : battle.right_ready;
  const opponentReady = isLeftUser ? battle.right_ready : battle.left_ready;
  const currentUserCodeConfirmed =
    isLeftUser ? battle.left_code_confirmed : battle.right_code_confirmed;
  const opponentCodeConfirmed =
    isLeftUser ? battle.right_code_confirmed : battle.left_code_confirmed;
  const currentUserMapChangeRequested =
    isLeftUser ? battle.left_map_change_requested : battle.right_map_change_requested;
  const opponentMapChangeRequested =
    isLeftUser ? battle.right_map_change_requested : battle.left_map_change_requested;
  const isLocked = battle.can_view_battle;
  const currentMapConfig = normalizeArenaMapConfig(
    battle.map_config,
    buildStaticArenaMapConfig('duel'),
  );
  const persistedResult: GameResult =
    battle.has_result && battle.result_scores && battle.result_scores.length === 2 ?
      {
        winner:
          battle.winner_slot === 'left' ? 0
          : battle.winner_slot === 'right' ? 1
          : null,
        reason: battle.result_reason ?? 'Результат сохранён',
        scores: [battle.result_scores[0], battle.result_scores[1]],
      }
    : null;
  const displayedResult = result ?? persistedResult;

  const handleSaveCode = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);

    startTransition(async () => {
      try {
        const nextBattle = await savePrivateBattleCodeAction(battle.id, code);
        setBattle(nextBattle);
        setStatusMessage('Код сохранён в комнате. Подтвердите код заново перед готовностью.');
      } catch {
        setErrorMessage('Не удалось сохранить код. Возможно, комната уже заблокирована после старта боя.');
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleConfirmCode = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsConfirmingCode(true);

    startTransition(async () => {
      try {
        const nextBattle = await confirmPrivateBattleCodeAction(battle.id);
        setBattle(nextBattle);
        setStatusMessage('Код подтверждён. Теперь можно либо сменить карту, либо подтвердить готовность.');
      } catch {
        setErrorMessage('Не удалось подтвердить код. Сначала сохраните непустой код.');
      } finally {
        setIsConfirmingCode(false);
      }
    });
  };

  const handleRerollMap = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsRerollingMap(true);

    startTransition(async () => {
      try {
        const nextBattle = await rerollPrivateBattleMapAction(battle.id);
        setBattle(nextBattle);
        setStatusMessage(
          nextBattle.map_revision !== battle.map_revision ?
            'Оба игрока согласились. Карта сгенерирована заново, готовность сброшена.'
          : 'Запрос на смену карты отправлен. Ожидаем согласие второго игрока.',
        );
      } catch {
        setErrorMessage('Не удалось сменить карту. Возможно, комната уже заблокирована.');
      } finally {
        setIsRerollingMap(false);
      }
    });
  };

  const handleMarkReady = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const nextBattle = await markPrivateBattleReadyAction(battle.id);
        setBattle(nextBattle);
        setStatusMessage(
          nextBattle.can_view_battle ?
            'Оба игрока готовы. Комната заблокирована для редактирования и доступна только для просмотра.'
          : 'Готовность подтверждена. Ожидаем второго игрока.',
        );
      } catch {
        setErrorMessage('Не удалось подтвердить готовность. Проверьте код или убедитесь, что комната ещё не заблокирована.');
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const viewerBattle: ActiveBattle | null =
    battle.can_view_battle && battle.left_code && battle.right_code ?
      {
        id: battle.id,
        title: battle.title,
        status: battle.status,
        left_player_id: battle.left_player_id,
        right_player_id: battle.right_player_id,
        left_submission_id: null,
        right_submission_id: null,
        left_player_name: battle.left_player_name,
        right_player_name: battle.right_player_name,
        left_submission_version: null,
        right_submission_version: null,
        left_code: battle.left_code,
        right_code: battle.right_code,
        map_config: battle.map_config,
        started_at: null,
        updated_at: battle.updated_at,
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-indigo-600">
            <Swords className="h-3.5 w-3.5" />
            Приватный бой
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            {battle.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Комната #{battle.id}. Карта случайная, её можно менять до финальной готовности. Бой в комнате ровно один.
          </p>
          {battle.finished_at && (
            <p className="mt-1 text-xs text-slate-500">
              Результат сохранён.
            </p>
          )}
        </div>

        <Link
          href="/private-battles"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Вернуться к списку
        </Link>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Вы
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950">
            {currentUserName}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            @{currentUserUsername}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {getCodeConfirmationLabel(currentUserCodeConfirmed)}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {currentUserMapChangeRequested ? 'Вы запросили смену карты' : 'Смена карты не запрошена'}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {getSlotReadinessLabel(currentUserReady)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Соперник
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950">
            {opponentName}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            @{opponentUsername}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {getCodeConfirmationLabel(opponentCodeConfirmed)}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {opponentMapChangeRequested ? 'Соперник запросил смену карты' : 'Соперник карту не менял'}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {getSlotReadinessLabel(opponentReady)}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Случайная карта
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Версия карты #{battle.map_revision}. Карта сменится только если оба игрока прожмут запрос на смену.
            </div>
          </div>
          {!isLocked && (
            <button
              type="button"
              onClick={handleRerollMap}
              disabled={
                isSaving ||
                isConfirmingCode ||
                isSubmitting ||
                isRerollingMap ||
                isRunning ||
                currentUserMapChangeRequested
              }
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className='h-4 w-4' />
              {isRerollingMap ? 'Отправка...' : currentUserMapChangeRequested ? 'Ожидаем второго' : 'Запросить смену карты'}
            </button>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <GameBoard field={currentMapConfig.grid} />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Ваш код для комнаты
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {isLocked ?
                'Бой уже зафиксирован. Эта комната доступна только для просмотра симуляции и результата.'
              : 'Изменение кода снимает подтверждение кода и готовность. После подтверждения кода можно менять карту или подтверждать готовность.'}
            </div>
          </div>

          {!isLocked && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveCode}
                disabled={isSaving || isSubmitting || isRunning}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Сохранение...' : 'Сохранить код'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCode}
                disabled={
                  isSaving ||
                  isConfirmingCode ||
                  isSubmitting ||
                  isRerollingMap ||
                  isRunning ||
                  code.trim().length === 0 ||
                  currentUserCodeConfirmed
                }
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isConfirmingCode ? 'Подтверждение...' : 'Подтвердить код'}
              </button>
              <button
                type="button"
                onClick={handleMarkReady}
                disabled={
                  isSaving ||
                  isConfirmingCode ||
                  isSubmitting ||
                  isRerollingMap ||
                  isRunning ||
                  !currentUserCodeConfirmed
                }
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Подтверждение...' : 'Я готов'}
              </button>
            </div>
          )}
        </div>

        {(statusMessage || errorMessage) && (
          <div className="mt-4 space-y-2 text-sm">
            {statusMessage && <p className="text-emerald-700">{statusMessage}</p>}
            {errorMessage && <p className="text-rose-700">{errorMessage}</p>}
          </div>
        )}

        <div className="mt-4">
          <ScriptEditor
            playerLabel="Мой алгоритм для приватного боя"
            playerEmoji={isLeftUser ? '🔴' : '🟢'}
            script={code}
            onScriptChange={setCode}
            disabled={isRunning || isLocked}
          />
        </div>
      </div>

      {viewerBattle ? (
        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="flex-1 flex items-start justify-center">
            <GameBoard field={field} />
          </div>

          <div className="xl:w-72 flex flex-col gap-4">
            <ControlPanel
              canManageArena={false}
              isRunning={isRunning}
              currentStep={currentStep}
              histories={histories}
              mapType={mapType}
              speedIndex={speedIndex}
              result={displayedResult}
              mapWidth={mapWidth}
              mapHeight={mapHeight}
              gameMode={gameMode}
              activeBattle={viewerBattle}
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
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-6 text-sm text-slate-600 shadow-sm">
          Бой откроется здесь, когда оба участника сохранят код и подтвердят готовность.
        </div>
      )}
    </div>
  );
}
