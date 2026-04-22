'use client';

import Link from 'next/link';
import { startTransition, useEffect, useId, useState } from 'react';
import { Swords, Plus } from 'lucide-react';

import {
  createPrivateBattleAction,
  getPrivateBattleUsersAction,
} from '@/app/private-battles/actions';
import {
  type PrivateBattleListItem,
  type PrivateBattleUserOption,
} from '@/src/shared/lib/api/internal';

function readinessLabel(isReady: boolean) {
  return isReady ? 'Готов' : 'Ждёт код';
}

function roomStateLabel(battle: PrivateBattleListItem) {
  if (battle.has_result) {
    const currentUserWon =
      (battle.current_user_slot === 'left' && battle.winner_slot === 'left') ||
      (battle.current_user_slot === 'right' && battle.winner_slot === 'right');

    if (battle.winner_slot === null) {
      return 'Ничья';
    }

    return currentUserWon ? 'Победа' : 'Поражение';
  }

  if (battle.left_ready && battle.right_ready) {
    return 'Готово к просмотру';
  }

  if (battle.left_ready || battle.right_ready) {
    return 'Ожидание соперника';
  }

  return 'Открыта';
}

function roomStateClasses(battle: PrivateBattleListItem) {
  if (battle.has_result) {
    const currentUserWon =
      (battle.current_user_slot === 'left' && battle.winner_slot === 'left') ||
      (battle.current_user_slot === 'right' && battle.winner_slot === 'right');

    if (battle.winner_slot === null) {
      return 'border-amber-200 bg-amber-50 text-amber-800';
    }

    return currentUserWon ?
        'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-rose-200 bg-rose-50 text-rose-800';
  }

  if (battle.left_ready && battle.right_ready) {
    return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  }

  if (battle.left_ready || battle.right_ready) {
    return 'border-sky-200 bg-sky-50 text-sky-800';
  }

  return 'border-slate-200 bg-white text-slate-700';
}

export function PrivateBattlesPanel({
  currentUsername,
  initialBattles,
}: {
  currentUsername: string;
  initialBattles: PrivateBattleListItem[];
}) {
  const [battles, setBattles] = useState(initialBattles);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [suggestions, setSuggestions] = useState<PrivateBattleUserOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const suggestionsId = useId();

  useEffect(() => {
    const query = opponentUsername.trim().replace(/^@+/, '');

    const timer = setTimeout(() => {
      setIsSearching(true);

      void getPrivateBattleUsersAction(query)
        .then((users) => setSuggestions(users))
        .catch(() => setSuggestions([]))
        .finally(() => setIsSearching(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [opponentUsername]);

  const handleCreateBattle = () => {
    const nextOpponentUsername = opponentUsername.trim().replace(/^@+/, '');

    if (!nextOpponentUsername) {
      setErrorMessage('Введите username соперника');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const battle = await createPrivateBattleAction(nextOpponentUsername);
        setBattles((current) => [
          {
            id: battle.id,
            title: battle.title,
            status: battle.status,
            left_player_id: battle.left_player_id,
            right_player_id: battle.right_player_id,
            left_player_name: battle.left_player_name,
            left_player_username: battle.left_player_username,
            right_player_name: battle.right_player_name,
            right_player_username: battle.right_player_username,
            left_ready: battle.left_ready,
            right_ready: battle.right_ready,
            left_code_confirmed: battle.left_code_confirmed,
            right_code_confirmed: battle.right_code_confirmed,
            left_map_change_requested: battle.left_map_change_requested,
            right_map_change_requested: battle.right_map_change_requested,
            map_revision: battle.map_revision,
            has_result: battle.has_result,
            winner_player_id: battle.winner_player_id,
            winner_slot: battle.winner_slot,
            result_reason: battle.result_reason,
            result_scores: battle.result_scores,
            finished_at: battle.finished_at,
            current_user_slot: battle.current_user_slot,
            updated_at: battle.updated_at,
          },
          ...current,
        ]);
        setOpponentUsername('');
      } catch {
        setErrorMessage('Не удалось создать комнату. Проверьте username и наличие открытого боя.')
      } finally {
        setIsCreating(false);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-indigo-600">
            <Swords className="h-3.5 w-3.5" />
            Приватные бои
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            Приглашение по username
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ваш username: <span className="font-semibold text-slate-900">@{currentUsername}</span>
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="flex gap-2">
            <input
              type="text"
              list={suggestionsId}
              value={opponentUsername}
              onChange={(event) => setOpponentUsername(event.target.value)}
              placeholder="@username соперника"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleCreateBattle}
              disabled={isCreating}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Создание...' : 'Создать'}
            </button>
          </div>

          <datalist id={suggestionsId}>
            {suggestions.map((user) => (
              <option key={user.id} value={`@${user.username}`}>
                {user.display_name ? `${user.display_name} (@${user.username})` : `@${user.username}`}
              </option>
            ))}
          </datalist>

          <p className="mt-2 text-xs text-slate-500">
            Поддерживается ввод с `@` и без него.
            {isSearching ? ' Ищем пользователей...' : ''}
          </p>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm text-rose-700">{errorMessage}</p>
      )}

      <div className="mt-4 space-y-3">
        {battles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            Пока нет активных приватных комнат.
          </div>
        ) : (
          battles.map((battle) => {
            const isLeftUser = battle.current_user_slot === 'left';
            const currentUserName =
              isLeftUser ? battle.left_player_name : battle.right_player_name;
            const currentUserUsername =
              isLeftUser ? battle.left_player_username : battle.right_player_username;
            const opponentName =
              isLeftUser ? battle.right_player_name : battle.left_player_name;
            const opponentUsername =
              isLeftUser ? battle.right_player_username : battle.left_player_username;
            const currentUserReady =
              isLeftUser ? battle.left_ready : battle.right_ready;
            const opponentReady =
              isLeftUser ? battle.right_ready : battle.left_ready;

            return (
              <Link
                key={battle.id}
                href={`/private-battles/${battle.id}`}
                className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-indigo-300 hover:bg-white"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {currentUserName} vs {opponentName}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      @{currentUserUsername} vs @{opponentUsername}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {battle.has_result ? `Архив комнаты #${battle.id}` : `Комната #${battle.id}`}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Карта #{battle.map_revision}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${roomStateClasses(
                          battle,
                        )}`}
                      >
                        {roomStateLabel(battle)}
                      </span>
                    </div>
                    {battle.result_reason && (
                      <div className="mt-2 text-xs text-slate-500">
                        {battle.result_reason}
                      </div>
                    )}
                    {battle.result_scores && battle.result_scores.length === 2 && (
                      <div className="mt-1 text-xs text-slate-500">
                        Счёт: 🔴 {battle.result_scores[0]} · 🟢 {battle.result_scores[1]}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                      Вы: {readinessLabel(currentUserReady)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                      Соперник: {readinessLabel(opponentReady)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
