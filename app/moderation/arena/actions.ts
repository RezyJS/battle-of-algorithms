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
    throw new Error('Forbidden');
  }
}

function clampDimension(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function setActiveBattleAction(formData: FormData) {
  await assertAccess();

  const leftPlayerId = Number(formData.get('left_player_id'));
  const rightPlayerId = Number(formData.get('right_player_id'));

  if (!leftPlayerId || !rightPlayerId) {
    throw new Error('Invalid arena payload');
  }

  const currentBattle = await getActiveBattle();
  const nextConfig = normalizeArenaMapConfig(
    currentBattle?.map_config,
    buildStaticArenaMapConfig(),
  );

  await setActiveBattle(leftPlayerId, rightPlayerId, nextConfig);
  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');
}

export async function clearActiveBattleAction() {
  await assertAccess();

  await clearActiveBattle();
  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');
}

export async function updateActiveBattleConfigAction(formData: FormData) {
  await assertAccess();

  const gameMode = formData.get('game_mode');
  const mapType = formData.get('map_type');
  const width = Number(formData.get('width'));
  const height = Number(formData.get('height'));

  if (
    (gameMode !== 'race' && gameMode !== 'duel') ||
    (mapType !== 'static' && mapType !== 'random')
  ) {
    throw new Error('Invalid arena config payload');
  }

  const nextConfig =
    mapType === 'random'
      ? buildRandomArenaMapConfig(
          clampDimension(width, MAP_SIZE_LIMITS.minWidth, MAP_SIZE_LIMITS.maxWidth),
          clampDimension(height, MAP_SIZE_LIMITS.minHeight, MAP_SIZE_LIMITS.maxHeight),
          gameMode as ArenaGameMode,
        )
      : buildStaticArenaMapConfig(gameMode as ArenaGameMode);

  await updateActiveBattleConfig(nextConfig);

  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');
}
