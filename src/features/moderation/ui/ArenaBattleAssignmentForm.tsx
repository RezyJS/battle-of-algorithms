'use client';

import { useActionState } from 'react';

import {
  clearActiveBattleAction,
  setActiveBattleAction,
} from '@/app/moderation/arena/actions';
import type { ActiveBattle, ArenaUserOption } from '@/src/shared/lib/api/internal';

export function ArenaBattleAssignmentForm({
  users,
  activeBattle,
}: {
  users: ArenaUserOption[];
  activeBattle: ActiveBattle | null;
}) {
  const [assignState, assignAction] = useActionState(setActiveBattleAction, {
    error: null,
    success: null,
  });
  const [clearState, clearAction] = useActionState(clearActiveBattleAction, {
    error: null,
    success: null,
  });

  return (
    <form
      action={assignAction}
      className="rounded-2xl border border-slate-200 bg-white/80 p-5 space-y-4 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Назначить бой</h2>
        <p className="mt-1 text-sm text-slate-600">
          Выбранные игроки появятся на главной странице.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-700">Игрок слева</span>
          <select
            name="left_player_id"
            defaultValue={activeBattle?.left_player_id ?? ''}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="" disabled>
              Выбрать игрока
            </option>
            {users.map((player) => (
              <option key={player.id} value={player.id}>
                {player.display_name ?? player.username}
                {player.approved_submission_version
                  ? ` · v${player.approved_submission_version}`
                  : ' · нет approved'}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-slate-700">Игрок справа</span>
          <select
            name="right_player_id"
            defaultValue={activeBattle?.right_player_id ?? ''}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="" disabled>
              Выбрать игрока
            </option>
            {users.map((player) => (
              <option key={player.id} value={player.id}>
                {player.display_name ?? player.username}
                {player.approved_submission_version
                  ? ` · v${player.approved_submission_version}`
                  : ' · нет approved'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">
          Approved
        </p>
        <div className="mt-3 grid gap-2">
          {users.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-slate-700">
                {player.display_name ?? player.username}
              </span>
              <span
                className={
                  player.approved_submission_version
                    ? 'text-emerald-600'
                    : 'text-amber-700'
                }
              >
                {player.approved_submission_version
                  ? `v${player.approved_submission_version}`
                  : 'нет approved'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {(assignState.error || clearState.error) && (
        <p className="text-sm text-rose-600">
          {assignState.error ?? clearState.error}
        </p>
      )}

      {(assignState.success || clearState.success) && (
        <p className="text-sm text-emerald-600">
          {assignState.success ?? clearState.success}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 shadow-sm"
        >
          Сохранить пару
        </button>
        <button
          type="submit"
          formAction={clearAction}
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Снять бой
        </button>
      </div>
    </form>
  );
}
