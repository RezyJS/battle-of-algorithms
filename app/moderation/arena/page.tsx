import Link from 'next/link';

import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { MAP_SIZE_LIMITS } from '@/src/app/model/game-store';
import { normalizeArenaMapConfig } from '@/src/shared/lib/arena-config';
import {
  getActiveBattle,
  getArenaUsers,
} from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import {
  clearActiveBattleAction,
  setActiveBattleAction,
  updateActiveBattleConfigAction,
} from '@/app/moderation/arena/actions';

function mapTypeLabel(mapType: 'static' | 'random' | 'custom') {
  if (mapType === 'random') return 'Случайная';
  if (mapType === 'custom') return 'Кастомная';
  return 'Статическая';
}

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
  const activeConfig = activeBattle?.map_config
    ? normalizeArenaMapConfig(activeBattle.map_config)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex gap-2">
        <Link
          href="/moderation"
          className="rounded-lg border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Отправки
        </Link>
        <div className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm">
          Состав арены
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-600">
          Arena Lineup
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Игроки на арене
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Здесь выбирается текущая пара, режим боя и общая карта, которую увидят
          все клиенты.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          action={setActiveBattleAction}
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

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 shadow-sm"
            >
              Сохранить пару
            </button>
            <button
              type="submit"
              formAction={clearActiveBattleAction}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Снять бой
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Сейчас на арене</h2>
          {activeBattle ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">
                  Active
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {activeBattle.left_player_name} vs {activeBattle.right_player_name}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Approved: v{activeBattle.left_submission_version} vs v{activeBattle.right_submission_version}
                </p>
                {activeConfig && (
                  <>
                    <p className="mt-2 text-sm text-slate-600">
                      Режим: {activeConfig.gameMode === 'race' ? 'Гонка' : 'Дуэль'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Карта: {mapTypeLabel(activeConfig.mapType)} · {activeConfig.width}×{activeConfig.height}
                    </p>
                  </>
                )}
                <p className="mt-2 text-sm text-slate-600">
                  Обновлено {new Date(activeBattle.updated_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Активный бой не выбран.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          action={updateActiveBattleConfigAction}
          className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Настройки арены</h2>
            <p className="mt-1 text-sm text-slate-600">
              Эти параметры сохраняются в активный бой на сервере и сразу влияют
              на всех зрителей.
            </p>
          </div>

          {activeBattle ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-slate-700">Режим</span>
                  <select
                    name="game_mode"
                    defaultValue={activeConfig?.gameMode ?? 'race'}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="race">Гонка</option>
                    <option value="duel">Дуэль</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-700">Тип карты</span>
                  <select
                    name="map_type"
                    defaultValue={
                      activeConfig?.mapType === 'custom'
                        ? 'static'
                        : (activeConfig?.mapType ?? 'static')
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="static">Статическая</option>
                    <option value="random">Случайная</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-slate-700">Ширина случайной карты</span>
                  <input
                    name="width"
                    type="number"
                    min={MAP_SIZE_LIMITS.minWidth}
                    max={MAP_SIZE_LIMITS.maxWidth}
                    defaultValue={activeConfig?.width ?? 10}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-700">Высота случайной карты</span>
                  <input
                    name="height"
                    type="number"
                    min={MAP_SIZE_LIMITS.minHeight}
                    max={MAP_SIZE_LIMITS.maxHeight}
                    defaultValue={activeConfig?.height ?? 8}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Кастомная карта задаётся через{' '}
                <Link href="/map-editor" className="text-indigo-600 hover:underline">
                  конструктор карт
                </Link>
                . Если сейчас активна кастомная карта, это действие заменит её на
                выбранную здесь статическую или случайную.
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-indigo-500"
                >
                  Сохранить настройки
                </button>
                <Link
                  href="/map-editor"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Открыть конструктор
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Сначала назначьте активный бой. После этого настройки арены и
              кастомная карта будут сохраняться в него.
            </div>
          )}
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Текущая конфигурация</h2>
          {activeConfig ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">
                  Shared
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Режим: <span className="font-medium text-slate-950">{activeConfig.gameMode === 'race' ? 'Гонка' : 'Дуэль'}</span>
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Тип карты: <span className="font-medium text-slate-950">{mapTypeLabel(activeConfig.mapType)}</span>
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Размер: <span className="font-medium text-slate-950">{activeConfig.width}×{activeConfig.height}</span>
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Спавны: <span className="font-medium text-slate-950">({activeConfig.spawn1.x}, {activeConfig.spawn1.y})</span> и{' '}
                  <span className="font-medium text-slate-950">({activeConfig.spawn2.x}, {activeConfig.spawn2.y})</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Конфигурация появится после выбора активного боя.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
