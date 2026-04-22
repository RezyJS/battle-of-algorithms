'use server';

import { revalidatePath } from 'next/cache';

import {
  getActiveBattle,
  clearActiveBattle,
  setActiveBattle,
  updateActiveBattleConfig,
} from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import {
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

export type ArenaActionState = {
  error: string | null;
  success: string | null;
};

export async function setActiveBattleAction(
  _prevState: ArenaActionState,
  formData: FormData,
): Promise<ArenaActionState> {
  if (!(await assertAccess())) {
    return { error: 'Нет доступа', success: null };
  }

  const leftPlayerId = Number(formData.get('left_player_id'));
  const rightPlayerId = Number(formData.get('right_player_id'));

  if (!leftPlayerId || !rightPlayerId) {
    return { error: 'Выберите обоих игроков', success: null };
  }

  const currentBattle = await getActiveBattle();
  const nextConfig = normalizeArenaMapConfig(
    currentBattle?.map_config,
    buildStaticArenaMapConfig(),
  );

  try {
    await setActiveBattle(leftPlayerId, rightPlayerId, nextConfig);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Не удалось сохранить пару',
      success: null,
    };
  }

  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');

  return { error: null, success: 'Пара сохранена' };
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

  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');

  return { error: null, success: 'Активный бой снят' };
}

export async function updateActiveBattleConfigAction(
  _prevState: ArenaActionState,
  formData: FormData,
): Promise<ArenaActionState> {
  if (!(await assertAccess())) {
    return { error: 'Нет доступа', success: null };
  }

  const gameMode = formData.get('game_mode');
  const mapType = formData.get('map_type');
  const width = Number(formData.get('width'));
  const height = Number(formData.get('height'));

  if (
    (gameMode !== 'race' && gameMode !== 'duel') ||
    (mapType !== 'static' && mapType !== 'random')
  ) {
    return { error: 'Некорректные настройки арены', success: null };
  }

  const nextConfig =
    mapType === 'random'
      ? buildRandomArenaMapConfig(
          clampDimension(width, MAP_SIZE_LIMITS.minWidth, MAP_SIZE_LIMITS.maxWidth),
          clampDimension(height, MAP_SIZE_LIMITS.minHeight, MAP_SIZE_LIMITS.maxHeight),
          gameMode as ArenaGameMode,
        )
      : buildStaticArenaMapConfig(gameMode as ArenaGameMode);

  try {
    await updateActiveBattleConfig(nextConfig);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : 'Не удалось сохранить настройки',
      success: null,
    };
  }

  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');

  return { error: null, success: 'Настройки сохранены' };
}
