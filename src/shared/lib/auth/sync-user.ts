import type { SessionUser } from './types';
import { getApiUrl, getInternalApiSecret } from './config';

type SyncUserResponse = {
  id: number;
  keycloak_user_id: string;
  username: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean;
};

export async function syncUserProfile(user: SessionUser): Promise<SessionUser> {
  const response = await fetch(`${getApiUrl()}/api/internal/auth/sync-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-secret': getInternalApiSecret(),
    },
    cache: 'no-store',
    body: JSON.stringify({
      keycloak_user_id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.name,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync user profile');
  }

  const payload = (await response.json()) as SyncUserResponse;

  return {
    ...user,
    appUserId: payload.id,
    username: payload.username,
    email: payload.email,
    name: payload.display_name,
  };
}
