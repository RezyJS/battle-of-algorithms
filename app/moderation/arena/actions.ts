'use server';

import { revalidatePath } from 'next/cache';

import {
  clearActiveBattle,
  setActiveBattle,
} from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

async function assertAccess() {
  const currentUser = await getCurrentUser();
  const hasAccess =
    currentUser?.roles.some((role) => role === 'moderator' || role === 'admin') ??
    false;

  if (!hasAccess) {
    throw new Error('Forbidden');
  }
}

export async function setActiveBattleAction(formData: FormData) {
  await assertAccess();

  const leftPlayerId = Number(formData.get('left_player_id'));
  const rightPlayerId = Number(formData.get('right_player_id'));

  if (!leftPlayerId || !rightPlayerId) {
    throw new Error('Invalid arena payload');
  }

  await setActiveBattle(leftPlayerId, rightPlayerId);
  revalidatePath('/');
  revalidatePath('/moderation/arena');
}

export async function clearActiveBattleAction() {
  await assertAccess();

  await clearActiveBattle();
  revalidatePath('/');
  revalidatePath('/moderation/arena');
}
