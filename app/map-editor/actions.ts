'use server';

import { revalidatePath } from 'next/cache';

import { updateActiveBattleConfig } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import {
  buildCustomArenaMapConfig,
  type ArenaGameMode,
} from '@/src/shared/lib/arena-config';
import type { FieldGrid, GridPoint } from '@/src/shared/model';

interface CustomArenaMapPayload {
  grid: FieldGrid;
  spawn1: GridPoint;
  spawn2: GridPoint;
  gameMode: ArenaGameMode;
}

async function assertAccess() {
  const currentUser = await getCurrentUser();
  const hasAccess =
    currentUser?.roles.some((role) => role === 'moderator' || role === 'admin') ??
    false;

  if (!hasAccess) {
    throw new Error('Forbidden');
  }
}

export async function applyCustomArenaMapAction(payload: CustomArenaMapPayload) {
  await assertAccess();

  await updateActiveBattleConfig(
    buildCustomArenaMapConfig({
      grid: payload.grid,
      spawn1: payload.spawn1,
      spawn2: payload.spawn2,
      gameMode: payload.gameMode,
    }),
  );

  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');
}
