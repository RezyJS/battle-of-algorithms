'use client';

import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CircleCheckBig,
  CurlyBraces,
  Map,
  RefreshCw,
  Save,
  Send,
  Swords,
} from 'lucide-react';

import { createPrivateBattleAction } from '@/app/private-battles/actions';
import {
  confirmPrivateBattleCodeAction,
  confirmPrivateBattleMapAction,
  markPrivateBattleReadyAction,
  rerollPrivateBattleMapAction,
  savePrivateBattleCodeAction,
  savePrivateBattleResultAction,
} from '@/app/private-battles/[battleId]/actions';
import { useGameStore, SPEED_OPTIONS } from '@/src/app/model/game-store';
import {
  OperatorApiReference,
  ScriptEditor,
} from '@/src/features/script-editor';
import type { GameResult } from '@/src/app/model/game-store';
import type {
  ActiveBattle,
  PrivateBattle,
} from '@/src/shared/lib/api/internal';
import {
  loadPersistedPlaybackState,
  savePersistedPlaybackState,
} from '@/src/shared/lib/battle-playback-persist';
import {
  buildStaticArenaMapConfig,
  normalizeArenaMapConfig,
} from '@/src/shared/lib/arena-config';
import { cn } from '@/src/shared/lib/utils';
import { ArenaLegend } from '@/src/widgets/arena-legend';
import { ControlPanel } from '@/src/widgets/control-panel';
import { EventLog } from '@/src/widgets/event-log';
import { GameBoard } from '@/src/widgets/game-board';

type TUserCard = {
  title: string;
  userName: string;
  userUsername: string;
  isCodeApplied: boolean;
  isMapChangeRequested: boolean;
  isMapConfirmed: boolean;
  isUserReady: boolean;
};

type RoomTab = 'code' | 'map' | 'battle';

function StateDot({
  active,
  label,
  title,
  tone = 'green',
  icon: Icon,
}: {
  active: boolean;
  label: string;
  title: string;
  tone?: 'green' | 'amber';
  icon: typeof CircleCheckBig;
}) {
  return (
    <div
      title={title}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium leading-none',
        active ?
          tone === 'amber' ?
            'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-slate-50 text-slate-500',
      )}
    >
      <Icon className='h-3.5 w-3.5' />
      {label}
    </div>
  );
}

function MapStateDot({
  isChangeRequested,
  isConfirmed,
}: {
  isChangeRequested: boolean;
  isConfirmed: boolean;
}) {
  const label = isChangeRequested ? 'Смена' : 'Карта';
  const title =
    isChangeRequested ? 'Игрок запросил смену карты'
    : isConfirmed ? 'Игрок подтвердил текущую карту'
    : 'Игрок ещё не подтвердил карту и не просит смену';

  return (
    <div
      title={title}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium leading-none',
        isChangeRequested ? 'border-amber-200 bg-amber-50 text-amber-800'
        : isConfirmed ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-slate-50 text-slate-500',
      )}
    >
      <Map className='h-3.5 w-3.5' />
      {label}
    </div>
  );
}

function PlayerStatusCard(user: TUserCard) {
  const {
    title,
    userName,
    userUsername,
    isCodeApplied,
    isMapChangeRequested,
    isMapConfirmed,
    isUserReady,
  } = user;

  return (
    <div className='rounded-xl border border-slate-200 bg-white px-3 py-2.5'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <div className='text-[11px] uppercase tracking-[0.16em] text-slate-500'>
            {title}
          </div>
          <div className='mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5'>
            <p className='truncate text-sm font-semibold text-slate-950'>
              {userName}
            </p>
            <p className='text-xs text-slate-500'>@{userUsername}</p>
          </div>
        </div>

        <div className='flex flex-wrap gap-1.5'>
          <StateDot
            active={isCodeApplied}
            label='Код'
            title='Код сохранён и подтверждён игроком'
            icon={CurlyBraces}
          />
          <MapStateDot
            isChangeRequested={isMapChangeRequested}
            isConfirmed={isMapConfirmed}
          />
          <StateDot
            active={isUserReady}
            label='Готов'
            title='Игрок подтвердил финальную готовность'
            icon={CircleCheckBig}
          />
        </div>
      </div>
    </div>
  );
}

export function PrivateBattleRoomClient({
  battle: initialBattle,
}: {
  battle: PrivateBattle;
}) {
  const router = useRouter();
  const appliedScriptsKeyRef = useRef<string | null>(null);
  const appliedConfigKeyRef = useRef<string | null>(null);
  const restoredPlaybackKeyRef = useRef<string | null>(null);
  const [battle, setBattle] = useState(initialBattle);
  const [code, setCode] = useState(initialBattle.current_user_code);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);
  const [isConfirmingMap, setIsConfirmingMap] = useState(false);
  const [isCreatingRematch, setIsCreatingRematch] = useState(false);
  const [isRerollingMap, setIsRerollingMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [activeTab, setActiveTab] = useState<RoomTab>('code');
  const hasUnsavedCodeChanges = code !== battle.current_user_code;
  const isMutating =
    isSaving ||
    isConfirmingCode ||
    isConfirmingMap ||
    isCreatingRematch ||
    isRerollingMap ||
    isSubmitting ||
    isSavingResult;

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
      battle.left_code && battle.right_code ?
        `${battle.id}:${battle.left_code}:${battle.right_code}`
      : null,
    [battle.id, battle.left_code, battle.right_code],
  );
  const configKey = useMemo(
    () =>
      JSON.stringify(
        normalizeArenaMapConfig(battle.map_config, buildStaticArenaMapConfig()),
      ),
    [battle.map_config],
  );
  const playbackKey = useMemo(
    () =>
      battle.can_view_battle ?
        `private:${battle.id}:${battle.map_revision}:${battle.updated_at}`
      : null,
    [battle.can_view_battle, battle.id, battle.map_revision, battle.updated_at],
  );

  useEffect(() => {
    setBattle(initialBattle);
    setCode(initialBattle.current_user_code);
  }, [initialBattle]);

  useEffect(() => {
    if (hasUnsavedCodeChanges || isMutating) {
      return;
    }

    const controller = new AbortController();

    const refreshBattle = async () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      try {
        const response = await fetch(`/api/private-battles/${battle.id}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const nextBattle = (await response.json()) as PrivateBattle;

        setBattle((previousBattle) => {
          if (code === previousBattle.current_user_code) {
            setCode(nextBattle.current_user_code);
          }

          return nextBattle;
        });
      } catch {
        // noop
      }
    };

    refreshBattle();
    const intervalId = window.setInterval(refreshBattle, 2000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [battle.id, code, hasUnsavedCodeChanges, isMutating]);

  useEffect(() => {
    if (
      !battle.can_view_battle ||
      !battle.left_code ||
      !battle.right_code ||
      appliedScriptsKeyRef.current === scriptsKey
    ) {
      return;
    }

    appliedScriptsKeyRef.current = scriptsKey;
    setScriptsPair(battle.left_code, battle.right_code);
  }, [
    battle.can_view_battle,
    battle.left_code,
    battle.right_code,
    scriptsKey,
    setScriptsPair,
  ]);

  useEffect(() => {
    if (!battle.can_view_battle || appliedConfigKeyRef.current === configKey) {
      return;
    }

    appliedConfigKeyRef.current = configKey;
    const nextConfig = JSON.parse(configKey);

    applyArenaConfig(nextConfig);
  }, [battle.can_view_battle, applyArenaConfig, configKey]);

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
    if (
      !battle.can_view_battle ||
      !playbackKey ||
      histories.length === 0 ||
      restoredPlaybackKeyRef.current === playbackKey
    ) {
      return;
    }

    restoredPlaybackKeyRef.current = playbackKey;
    restorePlaybackState(loadPersistedPlaybackState(playbackKey));
  }, [
    battle.can_view_battle,
    histories.length,
    playbackKey,
    restorePlaybackState,
  ]);

  useEffect(() => {
    if (!battle.can_view_battle || !playbackKey || histories.length === 0) {
      return;
    }

    savePersistedPlaybackState(playbackKey, {
      currentStep,
      messages,
      result,
    });
  }, [
    battle.can_view_battle,
    currentStep,
    histories.length,
    messages,
    playbackKey,
    result,
  ]);

  useEffect(() => {
    if (
      !battle.can_view_battle ||
      !result ||
      battle.has_result ||
      isSavingResult
    ) {
      return;
    }

    setIsSavingResult(true);

    startTransition(async () => {
      try {
        const nextBattle = await savePrivateBattleResultAction(
          battle.id,
          result,
        );
        setBattle(nextBattle);
      } catch {
        setErrorMessage('Не удалось сохранить результат боя');
      } finally {
        setIsSavingResult(false);
      }
    });
  }, [
    battle.can_view_battle,
    battle.has_result,
    battle.id,
    isSavingResult,
    result,
  ]);

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
    isLeftUser ?
      battle.left_map_change_requested
    : battle.right_map_change_requested;
  const opponentMapChangeRequested =
    isLeftUser ?
      battle.right_map_change_requested
    : battle.left_map_change_requested;
  const currentUserMapConfirmed =
    isLeftUser ? battle.left_map_confirmed : battle.right_map_confirmed;
  const opponentMapConfirmed =
    isLeftUser ? battle.right_map_confirmed : battle.left_map_confirmed;
  const isLocked = battle.can_view_battle;
  const currentMapConfig = normalizeArenaMapConfig(
    battle.map_config,
    buildStaticArenaMapConfig('duel'),
  );
  const persistedResult: GameResult =
    (
      battle.has_result &&
      battle.result_scores &&
      battle.result_scores.length === 2
    ) ?
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
        setStatusMessage(
          'Код сохранён в комнате. Подтвердите код заново перед готовностью.',
        );
      } catch {
        setErrorMessage(
          'Не удалось сохранить код. Возможно, комната уже заблокирована после старта боя.',
        );
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleSaveAndConfirmCode = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsConfirmingCode(true);

    startTransition(async () => {
      try {
        const savedBattle =
          hasUnsavedCodeChanges ?
            await savePrivateBattleCodeAction(battle.id, code)
          : battle;
        const nextBattle = await confirmPrivateBattleCodeAction(savedBattle.id);
        setBattle(nextBattle);
        setCode(nextBattle.current_user_code);
        setStatusMessage(
          'Код сохранён и подтверждён. Теперь можно подтвердить готовность.',
        );
      } catch {
        setErrorMessage(
          'Не удалось сохранить и подтвердить код. Проверьте, что код не пустой.',
        );
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
        setErrorMessage(
          'Не удалось сменить карту. Возможно, комната уже заблокирована.',
        );
      } finally {
        setIsRerollingMap(false);
      }
    });
  };

  const handleConfirmMap = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsConfirmingMap(true);

    startTransition(async () => {
      try {
        const nextBattle = await confirmPrivateBattleMapAction(battle.id);
        setBattle(nextBattle);
        setStatusMessage(
          'Карта подтверждена. Теперь можно отмечать готовность.',
        );
      } catch {
        setErrorMessage(
          'Не удалось подтвердить карту. Возможно, комната уже заблокирована.',
        );
      } finally {
        setIsConfirmingMap(false);
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
        setErrorMessage(
          'Не удалось подтвердить готовность. Проверьте код или убедитесь, что комната ещё не заблокирована.',
        );
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const handleCreateRematch = () => {
    if (!opponentUsername) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsCreatingRematch(true);

    startTransition(async () => {
      try {
        await createPrivateBattleAction(opponentUsername);
        router.push('/private-battles');
      } catch {
        setErrorMessage(
          'Не удалось отправить приглашение на реванш. Возможно, между вами уже есть открытая комната или активный инвайт.',
        );
        setIsCreatingRematch(false);
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

  useEffect(() => {
    if (battle.can_view_battle && battle.left_code && battle.right_code) {
      setActiveTab('battle');
      return;
    }

    if (activeTab === 'battle') {
      setActiveTab('code');
    }
  }, [activeTab, battle.can_view_battle, battle.left_code, battle.right_code]);

  const roomTabs: Array<{
    id: RoomTab;
    label: string;
    icon: typeof CurlyBraces;
    disabled?: boolean;
  }> = [
    { id: 'code', label: 'Код и API', icon: CurlyBraces, disabled: isLocked },
    { id: 'map', label: 'Карта', icon: Map, disabled: isLocked },
    {
      id: 'battle',
      label: 'Просмотр боя',
      icon: Swords,
      disabled: !viewerBattle,
    },
  ];

  return (
    <div className='mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-5 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-indigo-600'>
              <Swords className='h-3.5 w-3.5' />
              Приватный бой
            </div>
            <h1 className='mt-2 truncate text-2xl font-bold text-slate-950'>
              {battle.title}
            </h1>
            <p className='mt-1 text-sm text-slate-600'>
              Комната #{battle.id} · карта v{battle.map_revision}
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Link
              href='/private-battles'
              className='inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              К списку
            </Link>
            {battle.has_result && (
              <button
                type='button'
                onClick={handleCreateRematch}
                disabled={isCreatingRematch}
                className='inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <Swords className='h-4 w-4' />
                {isCreatingRematch ? 'Создание...' : 'Реванш'}
              </button>
            )}
          </div>
        </div>

        <div className='mt-5 grid gap-3 lg:grid-cols-2'>
          <PlayerStatusCard
            title='Вы'
            userName={currentUserName || ''}
            userUsername={currentUserUsername || ''}
            isCodeApplied={currentUserCodeConfirmed}
            isMapChangeRequested={currentUserMapChangeRequested}
            isMapConfirmed={currentUserMapConfirmed}
            isUserReady={currentUserReady}
          />
          <PlayerStatusCard
            title='Соперник'
            userName={opponentName || ''}
            userUsername={opponentUsername || ''}
            isCodeApplied={opponentCodeConfirmed}
            isMapChangeRequested={opponentMapChangeRequested}
            isMapConfirmed={opponentMapConfirmed}
            isUserReady={opponentReady}
          />
        </div>

        {(statusMessage || errorMessage) && (
          <div className='mt-4 space-y-2 text-sm'>
            {statusMessage && (
              <p className='rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700'>
                {statusMessage}
              </p>
            )}
            {errorMessage && (
              <p className='rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700'>
                {errorMessage}
              </p>
            )}
          </div>
        )}
      </div>

      <div className='mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/85 p-2 shadow-sm'>
        {roomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type='button'
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45',
                isActive ?
                  'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              )}
            >
              <Icon className='h-4 w-4' />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'code' && !isLocked && (
        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <div>
            <div className='mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
              <div>
                <h2 className='text-base font-semibold text-slate-950'>
                  Код для боя
                </h2>
              </div>

              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={handleSaveCode}
                  disabled={isSaving || isSubmitting || isRunning}
                  className='inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <Save className='h-4 w-4' />
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type='button'
                  onClick={handleSaveAndConfirmCode}
                  disabled={
                    isSaving ||
                    isConfirmingCode ||
                    isConfirmingMap ||
                    isSubmitting ||
                    isRerollingMap ||
                    isRunning ||
                    code.trim().length === 0 ||
                    (currentUserCodeConfirmed && !hasUnsavedCodeChanges)
                  }
                  className='inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <CheckCircle2 className='h-4 w-4' />
                  {isConfirmingCode ?
                    'Подтверждение...'
                  : 'Сохранить и подтвердить'}
                </button>
                <button
                  type='button'
                  onClick={handleMarkReady}
                  disabled={
                    isSaving ||
                    isConfirmingCode ||
                    isConfirmingMap ||
                    isSubmitting ||
                    isRerollingMap ||
                    isRunning ||
                    !currentUserCodeConfirmed ||
                    !currentUserMapConfirmed ||
                    currentUserReady
                  }
                  className='inline-flex items-center gap-2 rounded-lg border border-indigo-700 bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <Send className='h-4 w-4' />
                  {isSubmitting ? 'Подтверждение...' : 'Я готов'}
                </button>
              </div>
            </div>

            <ScriptEditor
              playerLabel='Мой алгоритм для приватного боя'
              playerEmoji={isLeftUser ? '🔴' : '🟢'}
              script={code}
              onScriptChange={setCode}
              disabled={isRunning || isLocked}
            />
          </div>

          <aside className='space-y-4 xl:sticky xl:top-20 xl:self-start'>
            <OperatorApiReference />
          </aside>
        </div>
      )}

      {activeTab === 'map' && (
        <div className='rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm'>
          <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h2 className='text-base font-semibold text-slate-950'>Карта</h2>
              <p className='mt-1 text-sm text-slate-600'>
                Версия #{battle.map_revision}
              </p>
            </div>

            {!isLocked && (
              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={handleConfirmMap}
                  disabled={
                    isSaving ||
                    isConfirmingCode ||
                    isConfirmingMap ||
                    isSubmitting ||
                    isRerollingMap ||
                    isRunning ||
                    currentUserMapConfirmed
                  }
                  className='inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <CheckCircle2 className='h-4 w-4' />
                  {isConfirmingMap ?
                    'Подтверждение...'
                  : currentUserMapConfirmed ?
                    'Карта подтверждена'
                  : 'Подтвердить карту'}
                </button>
                <button
                  type='button'
                  onClick={handleRerollMap}
                  disabled={
                    isSaving ||
                    isConfirmingCode ||
                    isConfirmingMap ||
                    isSubmitting ||
                    isRerollingMap ||
                    isRunning ||
                    currentUserMapChangeRequested ||
                    (currentUserReady && !opponentMapChangeRequested)
                  }
                  className='inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <RefreshCw className='h-4 w-4' />
                  {isRerollingMap ?
                    'Отправка...'
                  : currentUserMapChangeRequested ?
                    'Ожидаем'
                  : 'Сменить карту'}
                </button>
              </div>
            )}
          </div>

          <div className='overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <div className='flex justify-center'>
              <GameBoard field={currentMapConfig.grid} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'battle' &&
        (viewerBattle ?
          <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]'>
            <div className='rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm'>
              <div className='flex justify-center'>
                <GameBoard field={field} />
              </div>
            </div>

            <div className='flex flex-col gap-4'>
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
                onStepBackward={stepBackward}
                onStepForward={stepForward}
                onSetStep={setStep}
                onSpeedChange={setSpeedIndex}
              />

              {scriptError && (
                <div className='rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 shadow-sm'>
                  {scriptError}
                </div>
              )}

              <EventLog messages={messages} />
              <ArenaLegend />
            </div>
          </div>
        : <div className='rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-6 text-sm text-slate-600 shadow-sm'>
            Бой откроется здесь, когда оба участника сохранят код и подтвердят
            готовность.
          </div>)}
    </div>
  );
}
