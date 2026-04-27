'use server';

import { revalidatePath } from 'next/cache';

import {
  acceptPrivateBattleInvite,
  createPrivateBattleInvite,
  declinePrivateBattleInvite,
  getPrivateBattleUsers,
  type PrivateBattle,
  type PrivateBattleInviteItem,
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
): Promise<PrivateBattleInviteItem> {
  await assertAuthenticated();

  const invite = await createPrivateBattleInvite(opponentUsername);
  revalidatePath('/private-battles');

  return invite;
}

export async function acceptPrivateBattleInviteAction(
  inviteId: number,
): Promise<PrivateBattle> {
  await assertAuthenticated();

  const battle = await acceptPrivateBattleInvite(inviteId);
  revalidatePath('/private-battles');

  return battle;
}

export async function declinePrivateBattleInviteAction(
  inviteId: number,
): Promise<PrivateBattleInviteItem> {
  await assertAuthenticated();

  const invite = await declinePrivateBattleInvite(inviteId);
  revalidatePath('/private-battles');

  return invite;
}

export async function getPrivateBattleUsersAction(
  query: string,
): Promise<PrivateBattleUserOption[]> {
  await assertAuthenticated();
  return getPrivateBattleUsers(query);
}
