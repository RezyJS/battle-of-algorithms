import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { ArenaSetupForm } from '@/src/features/moderation/ui/ArenaSetupForm';
import { normalizeArenaMapConfig } from '@/src/shared/lib/arena-config';
import {
  getActiveBattle,
  getArenaBattleResults,
  getArenaUsers,
} from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

function mapTypeLabel(mapType: 'static' | 'random' | 'custom') {
  if (mapType === 'random') return 'Случайная';
  if (mapType === 'custom') return 'Кастомная';
  return 'Фиксированная';
}

function winnerLabel(winnerSlot: 'left' | 'right' | null) {
  if (winnerSlot === 'left') return 'Победил левый игрок';
  if (winnerSlot === 'right') return 'Победил правый игрок';
  return 'Ничья';
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

  const [users, activeBattle, battleResults] = await Promise.all([
    getArenaUsers(),
    getActiveBattle(),
    getArenaBattleResults(8),
  ]);
  const activeConfig = activeBattle?.map_config
    ? normalizeArenaMapConfig(activeBattle.map_config)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Игроки на арене
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Здесь выбирается текущая пара, режим боя и общая карта, которую увидят
            все клиенты.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <ArenaSetupForm
            users={users}
            activeBattle={activeBattle}
            activeConfig={activeConfig}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">История боёв</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Последние бои публичной арены с сохранёнными результатами.
                </p>
              </div>
            </div>

            {battleResults.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Результатов пока нет.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                {battleResults.map((battle) => (
                  <div
                    key={battle.id}
                    className="grid gap-2 bg-white px-4 py-3 text-sm md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-medium text-slate-950">
                        {battle.left_player_name} vs {battle.right_player_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        @{battle.left_player_username} vs @{battle.right_player_username}
                      </p>
                      {battle.result_reason && (
                        <p className="mt-2 text-slate-600">{battle.result_reason}</p>
                      )}
                    </div>
                    <div className="md:text-right">
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                        {winnerLabel(battle.winner_slot)}
                      </span>
                      {battle.result_scores && battle.result_scores.length === 2 && (
                        <p className="mt-2 text-xs text-slate-500">
                          Счёт: {battle.result_scores[0]} : {battle.result_scores[1]}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(battle.finished_at ?? battle.updated_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Сейчас на арене</h2>
            {activeBattle ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">
                  Active
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {activeBattle.left_player_name} vs {activeBattle.right_player_name}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Approved: v{activeBattle.left_submission_version} vs v{activeBattle.right_submission_version}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Обновлено {new Date(activeBattle.updated_at).toLocaleString('ru-RU')}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Активный бой не выбран.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Конфигурация</h2>
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
        </aside>
      </div>
    </div>
  );
}
