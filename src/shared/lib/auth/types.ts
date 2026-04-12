export type AppRole = 'user' | 'moderator' | 'admin';

export type SessionUser = {
  appUserId?: number;
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  roles: AppRole[];
};

export type SessionPayload = {
  user: SessionUser;
  idToken?: string;
  exp: number;
  iat: number;
};
