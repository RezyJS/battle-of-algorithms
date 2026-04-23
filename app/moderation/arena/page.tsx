import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { ArenaSetupForm } from '@/src/features/moderation/ui/ArenaSetupForm';
import { ModerationNav } from '@/src/features/moderation/ui/ModerationNav';
import { normalizeArenaMapConfig } from '@/src/shared/lib/arena-config';
import {
  getActiveBattle,
  getArenaUsers,
} from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

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
      <ModerationNav />

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
        <ArenaSetupForm
          users={users}
          activeBattle={activeBattle}
          activeConfig={activeConfig}
        />

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
  );
}
