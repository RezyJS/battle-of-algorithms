'use server';

import { revalidatePath } from 'next/cache';

import {
  confirmPrivateBattleCode,
  markPrivateBattleReady,
  rerollPrivateBattleMap,
  savePrivateBattleCode,
  savePrivateBattleResult,
  type PrivateBattle,
} from '@/src/shared/lib/api/internal';
import type { GameResult } from '@/src/app/model/game-store';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

function assertAuthenticated() {
  return getCurrentUser().then((currentUser) => {
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    return currentUser;
  });
}

export async function savePrivateBattleCodeAction(
  battleId: number,
  code: string,
): Promise<PrivateBattle> {
  await assertAuthenticated();

  const battle = await savePrivateBattleCode(battleId, code);
  revalidatePath(`/private-battles/${battleId}`);
  revalidatePath('/editor');

  return battle;
}

export async function markPrivateBattleReadyAction(
  battleId: number,
): Promise<PrivateBattle> {
  await assertAuthenticated();

  const battle = await markPrivateBattleReady(battleId);
  revalidatePath(`/private-battles/${battleId}`);
  revalidatePath('/editor');

  return battle;
}

export async function confirmPrivateBattleCodeAction(
  battleId: number,
): Promise<PrivateBattle> {
  await assertAuthenticated();

  const battle = await confirmPrivateBattleCode(battleId);
  revalidatePath(`/private-battles/${battleId}`);
  revalidatePath('/private-battles');

  return battle;
}

export async function rerollPrivateBattleMapAction(
  battleId: number,
): Promise<PrivateBattle> {
  await assertAuthenticated();

  const battle = await rerollPrivateBattleMap(battleId);
  revalidatePath(`/private-battles/${battleId}`);
  revalidatePath('/private-battles');

  return battle;
}

export async function savePrivateBattleResultAction(
  battleId: number,
  result: NonNullable<GameResult>,
): Promise<PrivateBattle> {
  await assertAuthenticated();

  const battle = await savePrivateBattleResult(battleId, result);
  revalidatePath(`/private-battles/${battleId}`);
  revalidatePath('/private-battles');

  return battle;
}
