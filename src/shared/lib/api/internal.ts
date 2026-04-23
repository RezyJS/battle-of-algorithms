import { getApiUrl, getInternalApiSecret } from '@/src/shared/lib/auth/config';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import type { ArenaMapConfig } from '@/src/shared/lib/arena-config';
import type { GameResult } from '@/src/app/model/game-store';

export type ModerationSubmission = {
  id: number;
  user_id: number;
  username: string;
  display_name: string | null;
  battle_id: number | null;
  code: string;
  language: string;
  status: string;
  version: number;
  moderation_comment: string | null;
  submitted_at: string | null;
  moderated_at: string | null;
  moderated_by: number | null;
  moderator_username: string | null;
  created_at: string;
  updated_at: string;
};

export type ModerationSubmissionPage = {
  items: ModerationSubmission[];
  total: number;
  page: number;
  page_size: number;
};

export type UserSubmission = {
  id: number;
  user_id: number;
  battle_id: number | null;
  code: string;
  language: string;
  status: string;
  submitted_at: string | null;
  moderated_at: string | null;
  moderated_by: number | null;
  moderation_comment: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ArenaUserOption = {
  id: number;
  username: string;
  display_name: string | null;
  approved_submission_id: number | null;
  approved_submission_version: number | null;
};

export type ActiveBattle = {
  id: number;
  title: string;
  status: string;
  left_player_id: number | null;
  right_player_id: number | null;
  left_submission_id: number | null;
  right_submission_id: number | null;
  left_player_name: string | null;
  right_player_name: string | null;
  left_submission_version: number | null;
  right_submission_version: number | null;
  left_code: string | null;
  right_code: string | null;
  map_config: ArenaMapConfig | null;
  started_at: string | null;
  updated_at: string;
};

export type PrivateBattleListItem = {
  id: number;
  title: string;
  status: string;
  left_player_id: number | null;
  right_player_id: number | null;
  left_player_name: string | null;
  left_player_username: string | null;
  right_player_name: string | null;
  right_player_username: string | null;
  left_ready: boolean;
  right_ready: boolean;
  left_code_confirmed: boolean;
  right_code_confirmed: boolean;
  left_map_change_requested: boolean;
  right_map_change_requested: boolean;
  map_revision: number;
  has_result: boolean;
  winner_player_id: number | null;
  winner_slot: 'left' | 'right' | null;
  result_reason: string | null;
  result_scores: number[] | null;
  finished_at: string | null;
  current_user_slot: 'left' | 'right';
  updated_at: string;
};

export type PrivateBattle = {
  id: number;
  title: string;
  status: string;
  left_player_id: number | null;
  right_player_id: number | null;
  left_player_name: string | null;
  left_player_username: string | null;
  right_player_name: string | null;
  right_player_username: string | null;
  left_ready: boolean;
  right_ready: boolean;
  left_code_confirmed: boolean;
  right_code_confirmed: boolean;
  left_map_change_requested: boolean;
  right_map_change_requested: boolean;
  map_revision: number;
  current_user_slot: 'left' | 'right';
  current_user_code: string;
  can_view_battle: boolean;
  has_result: boolean;
  winner_player_id: number | null;
  winner_slot: 'left' | 'right' | null;
  result_reason: string | null;
  result_scores: number[] | null;
  left_code: string | null;
  right_code: string | null;
  map_config: ArenaMapConfig | null;
  created_at: string;
  finished_at: string | null;
  updated_at: string;
};

export type PrivateBattleUserOption = {
  id: number;
  username: string;
  display_name: string | null;
};

async function internalFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-secret': getInternalApiSecret(),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let detail = `Internal API request failed: ${response.status}`;

    try {
      const payload = (await response.json()) as { detail?: string };

      if (payload.detail) {
        detail = payload.detail;
      }
    } catch {
      // noop
    }

    throw new Error(detail);
  }

  return response;
}

async function safeInternalJson<T>(
  path: string,
  fallback: T,
  init?: RequestInit,
): Promise<T> {
  try {
    const response = await internalFetch(path, init);
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getModerationSubmissions(): Promise<ModerationSubmission[]> {
  return safeInternalJson<ModerationSubmission[]>(
    '/api/internal/moderation/submissions',
    [],
  );
}

export async function getModerationSubmissionsPage(options?: {
  status?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}): Promise<ModerationSubmissionPage> {
  const searchParams = new URLSearchParams();

  if (options?.status) {
    searchParams.set('status', options.status);
  }

  if (options?.query) {
    searchParams.set('query', options.query);
  }

  searchParams.set('page', String(options?.page ?? 1));
  searchParams.set('page_size', String(options?.pageSize ?? 12));

  return safeInternalJson<ModerationSubmissionPage>(
    `/api/internal/moderation/submissions/page?${searchParams.toString()}`,
    {
      items: [],
      total: 0,
      page: options?.page ?? 1,
      page_size: options?.pageSize ?? 12,
    },
  );
}

export async function updateModerationSubmissionStatus(
  submissionId: number,
  status: string,
  comment: string,
) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  await internalFetch(`/api/internal/moderation/submissions/${submissionId}/status`, {
    method: 'POST',
    body: JSON.stringify({
      status,
      moderator_user_id: currentUser.appUserId,
      comment: comment || null,
    }),
  });
}

export async function getOwnSubmission(): Promise<UserSubmission | null> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const data = await safeInternalJson<{ submission: UserSubmission | null }>(
    `/api/internal/submissions/me?user_id=${currentUser.appUserId}`,
    { submission: null },
  );

  return data.submission;
}

export async function saveOwnSubmissionDraft(
  code: string,
  language = 'javascript',
): Promise<UserSubmission> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const response = await internalFetch('/api/internal/submissions/me/draft', {
    method: 'PUT',
    body: JSON.stringify({
      user_id: currentUser.appUserId,
      code,
      language,
    }),
  });

  return (await response.json()) as UserSubmission;
}

export async function submitOwnSubmission(
  code: string,
  language = 'javascript',
): Promise<UserSubmission> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const response = await internalFetch('/api/internal/submissions/me/submit', {
    method: 'POST',
    body: JSON.stringify({
      user_id: currentUser.appUserId,
      code,
      language,
    }),
  });

  return (await response.json()) as UserSubmission;
}

export async function getActiveBattle(): Promise<ActiveBattle | null> {
  return safeInternalJson<ActiveBattle | null>(
    '/api/internal/arena/active-battle',
    null,
  );
}

export async function getArenaUsers(): Promise<ArenaUserOption[]> {
  return safeInternalJson<ArenaUserOption[]>('/api/internal/arena/users', []);
}

export async function setActiveBattle(
  leftPlayerId: number,
  rightPlayerId: number,
  mapConfig?: ArenaMapConfig,
) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  await internalFetch('/api/internal/arena/active-battle', {
    method: 'POST',
    body: JSON.stringify({
      left_player_id: leftPlayerId,
      right_player_id: rightPlayerId,
      moderator_user_id: currentUser.appUserId,
      map_config: mapConfig ?? null,
    }),
  });
}

export async function updateActiveBattleConfig(mapConfig: ArenaMapConfig) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  await internalFetch('/api/internal/arena/active-battle/config', {
    method: 'POST',
    body: JSON.stringify({
      moderator_user_id: currentUser.appUserId,
      map_config: mapConfig,
    }),
  });
}

export async function clearActiveBattle() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  await internalFetch('/api/internal/arena/active-battle/clear', {
    method: 'POST',
    body: JSON.stringify({
      moderator_user_id: currentUser.appUserId,
    }),
  });
}

export async function getPrivateBattles(): Promise<PrivateBattleListItem[]> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  return safeInternalJson<PrivateBattleListItem[]>(
    `/api/internal/arena/private-battles?user_id=${currentUser.appUserId}`,
    [],
  );
}

export async function getPrivateBattle(
  battleId: number,
): Promise<PrivateBattle | null> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  return safeInternalJson<PrivateBattle | null>(
    `/api/internal/arena/private-battles/${battleId}?user_id=${currentUser.appUserId}`,
    null,
  );
}

export async function getPrivateBattleUsers(
  query = '',
): Promise<PrivateBattleUserOption[]> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const searchParams = new URLSearchParams({
    user_id: String(currentUser.appUserId),
    query,
  });

  return safeInternalJson<PrivateBattleUserOption[]>(
    `/api/internal/arena/private-battle-users?${searchParams.toString()}`,
    [],
  );
}

export async function createPrivateBattle(
  opponentUsername: string,
): Promise<PrivateBattle> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const response = await internalFetch('/api/internal/arena/private-battles', {
    method: 'POST',
    body: JSON.stringify({
      inviter_user_id: currentUser.appUserId,
      opponent_username: opponentUsername,
    }),
  });

  return (await response.json()) as PrivateBattle;
}

export async function savePrivateBattleCode(
  battleId: number,
  code: string,
): Promise<PrivateBattle> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const response = await internalFetch(
    `/api/internal/arena/private-battles/${battleId}/code`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: currentUser.appUserId,
        code,
      }),
    },
  );

  return (await response.json()) as PrivateBattle;
}

export async function confirmPrivateBattleCode(
  battleId: number,
): Promise<PrivateBattle> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const response = await internalFetch(
    `/api/internal/arena/private-battles/${battleId}/confirm-code`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: currentUser.appUserId,
      }),
    },
  );

  return (await response.json()) as PrivateBattle;
}

export async function rerollPrivateBattleMap(
  battleId: number,
): Promise<PrivateBattle> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const response = await internalFetch(
    `/api/internal/arena/private-battles/${battleId}/reroll-map`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: currentUser.appUserId,
      }),
    },
  );

  return (await response.json()) as PrivateBattle;
}

export async function markPrivateBattleReady(
  battleId: number,
): Promise<PrivateBattle> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const response = await internalFetch(
    `/api/internal/arena/private-battles/${battleId}/ready`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: currentUser.appUserId,
      }),
    },
  );

  return (await response.json()) as PrivateBattle;
}

export async function savePrivateBattleResult(
  battleId: number,
  result: NonNullable<GameResult>,
): Promise<PrivateBattle> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUserId) {
    throw new Error('Current user does not have appUserId in session');
  }

  const response = await internalFetch(
    `/api/internal/arena/private-battles/${battleId}/result`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: currentUser.appUserId,
        winner: result.winner,
        reason: result.reason,
        scores: result.scores,
      }),
    },
  );

  return (await response.json()) as PrivateBattle;
}
