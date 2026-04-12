import { getApiUrl, getInternalApiSecret } from '@/src/shared/lib/auth/config';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

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
  started_at: string | null;
  updated_at: string;
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
    throw new Error(`Internal API request failed: ${response.status}`);
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
