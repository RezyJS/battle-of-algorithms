'use server';

import { revalidatePath } from 'next/cache';

import { clearActiveBattle, setActiveBattle } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import {
  buildCustomArenaMapConfig,
  buildRandomArenaMapConfig,
  buildStaticArenaMapConfig,
  normalizeArenaMapConfig,
  type ArenaGameMode,
} from '@/src/shared/lib/arena-config';
import { MAP_SIZE_LIMITS } from '@/src/app/model/game-store';

async function assertAccess() {
  const currentUser = await getCurrentUser();
  const hasAccess =
    currentUser?.roles.some((role) => role === 'moderator' || role === 'admin') ??
    false;

  if (!hasAccess) {
    return false;
  }

  return true;
}

function clampDimension(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function revalidateArenaPages() {
  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');
}

function parseCustomMapConfig(
  rawValue: FormDataEntryValue | null,
  gameMode: ArenaGameMode,
) {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return null;
  }

  try {
    const normalized = normalizeArenaMapConfig(
      JSON.parse(rawValue),
      buildStaticArenaMapConfig(gameMode),
    );

    return buildCustomArenaMapConfig({
      grid: normalized.grid,
      spawn1: normalized.spawn1,
      spawn2: normalized.spawn2,
      gameMode,
    });
  } catch {
    return null;
  }
}

export type ArenaActionState = {
  error: string | null;
  success: string | null;
};

export async function configureArenaBattleAction(
  _prevState: ArenaActionState,
  formData: FormData,
): Promise<ArenaActionState> {
  if (!(await assertAccess())) {
    return { error: 'Нет доступа', success: null };
  }

  const leftPlayerId = Number(formData.get('left_player_id'));
  const rightPlayerId = Number(formData.get('right_player_id'));
  const gameMode = formData.get('game_mode');
  const mapType = formData.get('map_type');
  const width = Number(formData.get('width'));
  const height = Number(formData.get('height'));

  if (
    !leftPlayerId ||
    !rightPlayerId ||
    (gameMode !== 'race' && gameMode !== 'duel') ||
    (mapType !== 'static' && mapType !== 'random' && mapType !== 'custom')
  ) {
    return { error: 'Заполните состав и настройки арены', success: null };
  }

  const nextConfig =
    mapType === 'random' ?
      buildRandomArenaMapConfig(
        clampDimension(width, MAP_SIZE_LIMITS.minWidth, MAP_SIZE_LIMITS.maxWidth),
        clampDimension(height, MAP_SIZE_LIMITS.minHeight, MAP_SIZE_LIMITS.maxHeight),
        gameMode,
      )
    : mapType === 'custom' ?
      parseCustomMapConfig(formData.get('custom_map_config'), gameMode)
    : buildStaticArenaMapConfig(gameMode);

  if (!nextConfig) {
    return {
      error: 'Для кастомной карты сначала подготовьте схему в конструкторе.',
      success: null,
    };
  }

  try {
    await setActiveBattle(leftPlayerId, rightPlayerId, nextConfig);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : 'Не удалось подтвердить состав арены',
      success: null,
    };
  }

  revalidateArenaPages();

  return {
    error: null,
    success: 'Состав, режим и карта арены подтверждены',
  };
}

export async function clearActiveBattleAction(): Promise<ArenaActionState> {
  if (!(await assertAccess())) {
    return { error: 'Нет доступа', success: null };
  }

  try {
    await clearActiveBattle();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Не удалось снять бой',
      success: null,
    };
  }

  revalidateArenaPages();

  return { error: null, success: 'Активный бой снят' };
}
