'use server';

import { revalidatePath } from 'next/cache';

import { updateActiveBattleConfig } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import type { ArenaMapConfig } from '@/src/shared/lib/arena-config';

async function assertAccess() {
  const currentUser = await getCurrentUser();
  const hasAccess =
    currentUser?.roles.some((role) => role === 'moderator' || role === 'admin') ??
    false;

  if (!hasAccess) {
    throw new Error('Forbidden');
  }
}

export async function applyCustomArenaMapAction(payload: ArenaMapConfig) {
  await assertAccess();

  await updateActiveBattleConfig(payload);

  revalidatePath('/');
  revalidatePath('/moderation/arena');
  revalidatePath('/map-editor');
}
