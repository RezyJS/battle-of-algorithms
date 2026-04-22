'use server';

import { revalidatePath } from 'next/cache';

import {
  createPrivateBattle,
  getPrivateBattleUsers,
  type PrivateBattle,
  type PrivateBattleUserOption,
} from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

function assertAuthenticated() {
  return getCurrentUser().then((currentUser) => {
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    return currentUser;
  });
}

export async function createPrivateBattleAction(
  opponentUsername: string,
): Promise<PrivateBattle> {
  await assertAuthenticated();

  const battle = await createPrivateBattle(opponentUsername);
  revalidatePath('/private-battles');

  return battle;
}

export async function getPrivateBattleUsersAction(
  query: string,
): Promise<PrivateBattleUserOption[]> {
  await assertAuthenticated();
  return getPrivateBattleUsers(query);
}
