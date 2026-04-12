import Link from 'next/link';

import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import {
  getActiveBattle,
  getArenaUsers,
} from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import {
  clearActiveBattleAction,
  setActiveBattleAction,
} from '@/app/moderation/arena/actions';

export default async function ModerationArenaPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <AuthRequiredCard
          returnTo="/moderation/arena"
          title="Нужна авторизация"
          description="Войдите, чтобы управлять составом арены."
        />
      </div>
    );
  }

  const hasAccess = user.roles.some(
    (role) => role === 'moderator' || role === 'admin',
  );

  if (!hasAccess) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <ForbiddenCard description="Управление составом арены доступно только модераторам и администраторам." />
      </div>
    );
  }

  const [users, activeBattle] = await Promise.all([
    getArenaUsers(),
    getActiveBattle(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex gap-2">
        <Link
          href="/moderation"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
        >
          Отправки
        </Link>
        <div className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
          Состав арены
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">
          Arena Lineup
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Игроки на арене
        </h1>
        <p className="mt-3 text-sm text-gray-400">Здесь выбирается текущая пара для арены.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          action={setActiveBattleAction}
          className="rounded-2xl border border-white/10 bg-gray-900/40 p-5 space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">Назначить бой</h2>
            <p className="mt-1 text-sm text-gray-400">
              Выбранные игроки появятся на главной странице.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-gray-300">Игрок слева</span>
              <select
                name="left_player_id"
                defaultValue={activeBattle?.left_player_id ?? ''}
                className="w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
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
              <span className="text-sm text-gray-300">Игрок справа</span>
              <select
                name="right_player_id"
                defaultValue={activeBattle?.right_player_id ?? ''}
                className="w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
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

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
              Approved
            </p>
            <div className="mt-3 grid gap-2">
              {users.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-gray-200">
                    {player.display_name ?? player.username}
                  </span>
                  <span
                    className={
                      player.approved_submission_version
                        ? 'text-emerald-300'
                        : 'text-amber-300'
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

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
            >
              Сохранить пару
            </button>
            <button
              type="submit"
              formAction={clearActiveBattleAction}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
            >
              Снять бой
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-5">
          <h2 className="text-lg font-semibold text-white">Сейчас на арене</h2>
          {activeBattle ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                  Active
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {activeBattle.left_player_name} vs {activeBattle.right_player_name}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Approved: v{activeBattle.left_submission_version} vs v{activeBattle.right_submission_version}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Обновлено {new Date(activeBattle.updated_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-gray-400">
              Активный бой не выбран.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
