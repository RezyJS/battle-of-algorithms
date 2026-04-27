'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useId, useState } from 'react';
import {
  Check,
  Clock3,
  History,
  Inbox,
  Plus,
  Swords,
  X,
} from 'lucide-react';

import {
  acceptPrivateBattleInviteAction,
  createPrivateBattleAction,
  declinePrivateBattleInviteAction,
  getPrivateBattleUsersAction,
} from '@/app/private-battles/actions';
import { usePollingRefresh } from '@/src/shared/lib/usePollingRefresh';
import {
  type PrivateBattleInviteItem,
  type PrivateBattleListItem,
  type PrivateBattleUserOption,
} from '@/src/shared/lib/api/internal';
import { cn } from '@/src/shared/lib/utils';

type PrivateBattleTab = 'active' | 'invites' | 'history';

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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
      {text}
    </div>
  );
}

function BattleRow({ battle }: { battle: PrivateBattleListItem }) {
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

  return (
    <Link
      href={`/private-battles/${battle.id}`}
      className="grid gap-3 border-b border-slate-200 px-4 py-3 transition hover:bg-slate-50 last:border-b-0 md:grid-cols-[1fr_auto]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-950">
            {currentUserName} vs {opponentName}
          </p>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${roomStateClasses(
              battle,
            )}`}
          >
            {roomStateLabel(battle)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          @{currentUserUsername} vs @{opponentUsername} · комната #{battle.id} · карта #{battle.map_revision}
        </p>
        {battle.result_reason && (
          <p className="mt-2 text-xs text-slate-600">{battle.result_reason}</p>
        )}
      </div>

      {battle.has_result ?
        battle.result_scores &&
        battle.result_scores.length === 2 && (
          <div className="text-sm font-medium text-slate-700 md:text-right">
            {battle.result_scores[0]} : {battle.result_scores[1]}
          </div>
        )
      : <div className="flex flex-wrap items-center gap-2 text-xs leading-none md:justify-end">
          <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 text-slate-700">
            Вы: {readinessLabel(currentUserReady)}
          </span>
          <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 text-slate-700">
            Соперник: {readinessLabel(opponentReady)}
          </span>
        </div>
      }
    </Link>
  );
}

export function PrivateBattlesPanel({
  currentUsername,
  initialBattles,
  initialInvites,
}: {
  currentUsername: string;
  initialBattles: PrivateBattleListItem[];
  initialInvites: PrivateBattleInviteItem[];
}) {
  usePollingRefresh(4000);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<PrivateBattleTab>('active');
  const [battles, setBattles] = useState(initialBattles);
  const [invites, setInvites] = useState(initialInvites);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [suggestions, setSuggestions] = useState<PrivateBattleUserOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingInviteId, setPendingInviteId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const suggestionsId = useId();
  const activeBattles = battles.filter((battle) => !battle.has_result);
  const finishedBattles = battles.filter((battle) => battle.has_result);
  const incomingInvites = invites.filter(
    (invite) => invite.current_user_role === 'opponent',
  );
  const outgoingInvites = invites.filter(
    (invite) => invite.current_user_role === 'inviter',
  );
  const invitesCount = incomingInvites.length + outgoingInvites.length;

  useEffect(() => {
    setBattles(initialBattles);
  }, [initialBattles]);

  useEffect(() => {
    setInvites(initialInvites);
  }, [initialInvites]);

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
        const invite = await createPrivateBattleAction(nextOpponentUsername);
        setInvites((current) => [invite, ...current]);
        setOpponentUsername('');
        setActiveTab('invites');
      } catch {
        setErrorMessage(
          'Не удалось отправить приглашение. Проверьте username, открытые комнаты и активные инвайты.',
        );
      } finally {
        setIsCreating(false);
      }
    });
  };

  const handleAcceptInvite = (inviteId: number) => {
    setPendingInviteId(inviteId);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const battle = await acceptPrivateBattleInviteAction(inviteId);
        router.push(`/private-battles/${battle.id}`);
      } catch {
        setErrorMessage('Не удалось принять приглашение.');
        setPendingInviteId(null);
      }
    });
  };

  const handleDeclineInvite = (inviteId: number) => {
    setPendingInviteId(inviteId);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await declinePrivateBattleInviteAction(inviteId);
        setInvites((current) => current.filter((invite) => invite.id !== inviteId));
      } catch {
        setErrorMessage('Не удалось отклонить приглашение.');
      } finally {
        setPendingInviteId(null);
      }
    });
  };

  const tabs: Array<{
    id: PrivateBattleTab;
    label: string;
    count: number;
    icon: typeof Swords;
  }> = [
    { id: 'active', label: 'Активные', count: activeBattles.length, icon: Swords },
    { id: 'invites', label: 'Приглашения', count: invitesCount, icon: Inbox },
    { id: 'history', label: 'История', count: finishedBattles.length, icon: History },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,440px)] lg:items-end">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Приватная дуэль
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ваш username: <span className="font-semibold text-slate-900">@{currentUsername}</span>
            </p>
          </div>

          <div>
            <div className="flex gap-2">
              <input
                type="text"
                list={suggestionsId}
                value={opponentUsername}
                onChange={(event) => setOpponentUsername(event.target.value)}
                placeholder="@username соперника"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleCreateBattle}
                disabled={isCreating}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {isCreating ? 'Отправка...' : 'Пригласить'}
              </button>
            </div>

            <datalist id={suggestionsId}>
              {suggestions.map((user) => (
                <option
                  key={user.id}
                  value={`@${user.username}`}
                >
                  {user.display_name ?
                    `${user.display_name} (@${user.username})`
                  : `@${user.username}`}
                </option>
              ))}
            </datalist>

            <p className="mt-2 text-xs text-slate-500">
              Комната создаётся только после принятия приглашения.
              {isSearching ? ' Ищем пользователей...' : ''}
            </p>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-3 text-sm text-rose-700">{errorMessage}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  activeTab === tab.id ?
                    'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    activeTab === tab.id ?
                      'bg-white/20 text-white'
                    : 'text-slate-500',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === 'active' && (
          <div>
            {activeBattles.length === 0 ?
              <div className="p-4">
                <EmptyState text="Активных приватных комнат пока нет." />
              </div>
            : <div>
                {activeBattles.map((battle) => (
                  <BattleRow
                    key={battle.id}
                    battle={battle}
                  />
                ))}
              </div>
            }
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center gap-2">
                <Inbox className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Входящие
                </h3>
              </div>
              {incomingInvites.length === 0 ?
                <EmptyState text="Входящих приглашений нет." />
              : <div className="space-y-3">
                  {incomingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {invite.inviter_name} приглашает на бой
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        @{invite.inviter_username}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(invite.id)}
                          disabled={pendingInviteId === invite.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          Принять
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineInvite(invite.id)}
                          disabled={pendingInviteId === invite.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Исходящие
                </h3>
              </div>
              {outgoingInvites.length === 0 ?
                <EmptyState text="Исходящих приглашений нет." />
              : <div className="space-y-3">
                  {outgoingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        Ожидаем @{invite.opponent_username}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Комната появится после согласия второго игрока.
                      </p>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {finishedBattles.length === 0 ?
              <div className="p-4">
                <EmptyState text="История приватных боёв пока пустая." />
              </div>
            : <div>
                {finishedBattles.map((battle) => (
                  <BattleRow
                    key={battle.id}
                    battle={battle}
                  />
                ))}
              </div>
            }
          </div>
        )}
      </div>
    </section>
  );
}
