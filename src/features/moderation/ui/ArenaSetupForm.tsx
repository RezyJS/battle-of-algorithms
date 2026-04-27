'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  clearActiveBattleAction,
  configureArenaBattleAction,
} from '@/app/moderation/arena/actions';
import type { ActiveBattle, ArenaUserOption } from '@/src/shared/lib/api/internal';
import type { ArenaMapConfig } from '@/src/shared/lib/arena-config';
import { MAP_SIZE_LIMITS } from '@/src/app/model/game-store';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

const CUSTOM_MAP_DRAFT_KEY = 'boa-arena-custom-map-draft';

export function ArenaSetupForm({
  users,
  activeBattle,
  activeConfig,
}: {
  users: ArenaUserOption[];
  activeBattle: ActiveBattle | null;
  activeConfig: ArenaMapConfig | null;
}) {
  const [assignState, assignAction] = useActionState(configureArenaBattleAction, {
    error: null,
    success: null,
  });
  const [clearState, clearAction] = useActionState(clearActiveBattleAction, {
    error: null,
    success: null,
  });
  const [customMapDraft, setCustomMapDraft] = useState<ArenaMapConfig | null>(null);

  const initialMapType =
    activeConfig?.mapType === 'custom' ? 'custom' : (activeConfig?.mapType ?? 'static');
  const [selectedMapType, setSelectedMapType] = useState(initialMapType);

  useEffect(() => {
    setSelectedMapType(initialMapType);
  }, [initialMapType]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rawDraft = window.localStorage.getItem(CUSTOM_MAP_DRAFT_KEY);

    if (!rawDraft) {
      return;
    }

    try {
      setCustomMapDraft(JSON.parse(rawDraft) as ArenaMapConfig);
    } catch {
      window.localStorage.removeItem(CUSTOM_MAP_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!assignState.success || typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(CUSTOM_MAP_DRAFT_KEY);
    setCustomMapDraft(null);
  }, [assignState.success]);

  const effectiveCustomMap = useMemo(() => {
    if (customMapDraft) {
      return customMapDraft;
    }

    return activeConfig?.mapType === 'custom' ? activeConfig : null;
  }, [activeConfig, customMapDraft]);

  return (
    <form
      action={assignAction}
      className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Подтвердить арену</h2>
        <p className="mt-1 text-sm text-slate-600">
          Сначала соберите участников и карту, затем одной кнопкой отправьте всё
          в активный бой.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-700">Игрок слева</span>
          <Select
            name="left_player_id"
            defaultValue={
              activeBattle?.left_player_id ?
                String(activeBattle.left_player_id)
              : undefined
            }
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Выбрать игрока" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {users.map((player) => (
                  <SelectItem key={player.id} value={String(player.id)}>
                    {player.display_name ?? player.username}
                    {player.approved_submission_version
                      ? ` · v${player.approved_submission_version}`
                      : ' · нет approved'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-slate-700">Игрок справа</span>
          <Select
            name="right_player_id"
            defaultValue={
              activeBattle?.right_player_id ?
                String(activeBattle.right_player_id)
              : undefined
            }
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Выбрать игрока" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {users.map((player) => (
                  <SelectItem key={player.id} value={String(player.id)}>
                    {player.display_name ?? player.username}
                    {player.approved_submission_version
                      ? ` · v${player.approved_submission_version}`
                      : ' · нет approved'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-700">Режим</span>
          <Select
            name="game_mode"
            defaultValue={activeConfig?.gameMode ?? 'race'}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="race">Гонка</SelectItem>
                <SelectItem value="duel">Дуэль</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-slate-700">Сценарий карты</span>
          <Select
            name="map_type"
            value={selectedMapType}
            onValueChange={setSelectedMapType}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="static">Фиксированная карта</SelectItem>
                <SelectItem value="random">Случайная</SelectItem>
                <SelectItem value="custom">Конструктор</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-700">Ширина</span>
          <input
            name="width"
            type="number"
            min={MAP_SIZE_LIMITS.minWidth}
            max={MAP_SIZE_LIMITS.maxWidth}
            defaultValue={activeConfig?.width ?? 10}
            disabled={selectedMapType !== 'random'}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-500"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm text-slate-700">Высота</span>
          <input
            name="height"
            type="number"
            min={MAP_SIZE_LIMITS.minHeight}
            max={MAP_SIZE_LIMITS.maxHeight}
            defaultValue={activeConfig?.height ?? 8}
            disabled={selectedMapType !== 'random'}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-500"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-slate-900">Карта из конструктора</p>
            <p className="mt-1">Соберите сценарий и сохраните черновик для арены.</p>
          </div>

          <Link
            href="/map-editor?draft=1&returnTo=/moderation/arena"
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Открыть конструктор
          </Link>
        </div>

        {effectiveCustomMap ? (
          <p>
            Черновик: {effectiveCustomMap.width}×{effectiveCustomMap.height},
            спавны ({effectiveCustomMap.spawn1.x}, {effectiveCustomMap.spawn1.y}) и (
            {effectiveCustomMap.spawn2.x}, {effectiveCustomMap.spawn2.y}).
          </p>
        ) : (
          <p>Черновик не сохранён.</p>
        )}
      </div>

      <input
        type="hidden"
        name="custom_map_config"
        value={effectiveCustomMap ? JSON.stringify(effectiveCustomMap) : ''}
      />

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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 shadow-sm"
        >
          Подтвердить состав
        </button>
        <button
          type="submit"
          formAction={clearAction}
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          Снять текущий бой
        </button>
      </div>
    </form>
  );
}
