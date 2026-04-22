'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { MAP_SIZE_LIMITS } from '@/src/app/model/game-store';
import { updateActiveBattleConfigAction } from '@/app/moderation/arena/actions';
import type { ActiveBattle } from '@/src/shared/lib/api/internal';
import type { ArenaMapConfig } from '@/src/shared/lib/arena-config';

export function ArenaConfigForm({
  activeBattle,
  activeConfig,
}: {
  activeBattle: ActiveBattle | null;
  activeConfig: ArenaMapConfig | null;
}) {
  const [actionState, formAction] = useActionState(updateActiveBattleConfigAction, {
    error: null,
    success: null,
  });

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Настройки арены</h2>
        <p className="mt-1 text-sm text-slate-600">
          Эти параметры сохраняются в активный бой на сервере.
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
            .
          </div>

          {actionState.error && (
            <p className="text-sm text-rose-600">{actionState.error}</p>
          )}

          {actionState.success && (
            <p className="text-sm text-emerald-600">{actionState.success}</p>
          )}

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
          Сначала назначьте активный бой.
        </div>
      )}
    </form>
  );
}
